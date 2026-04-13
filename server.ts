import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Department, Section, Chat, Message, Document, Setting } from './src/lib/models';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_FILE = path.join(process.cwd(), 'data.json');

let isMongoConnected = false;
let localData: any = { users: [], departments: [], sections: [], chats: [], messages: [], documents: [], settings: {} };

// تحميل البيانات المحلية كاحتياط
function loadLocalData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      localData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) { console.error('Error loading data.json'); }
  }
}
loadLocalData();

async function connectDB() {
  if (isMongoConnected && mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isMongoConnected = true;
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Failed, using local data');
    isMongoConnected = false;
  }
}

const app = express();
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- API Routes (مع نظام الاحتياط الذكي) ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (isMongoConnected) {
    const user = await User.findOne({ email, password });
    if (user) return res.json({ user });
  }
  const user = localData.users.find((u: any) => u.email === email && u.password === password);
  if (user) return res.json({ user });
  res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
});

app.get('/api/users', async (req, res) => {
  if (isMongoConnected) return res.json(await User.find());
  res.json(localData.users);
});

app.post('/api/users', async (req, res) => {
  const newUser = { ...req.body, uid: Math.random().toString(36).substr(2, 9) };
  if (isMongoConnected) await User.create(newUser);
  localData.users.push(newUser);
  res.json(newUser);
});

app.get('/api/departments', async (req, res) => {
  if (isMongoConnected) return res.json(await Department.find());
  res.json(localData.departments);
});

app.post('/api/departments', async (req, res) => {
  const newDept = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  if (isMongoConnected) await Department.create(newDept);
  localData.departments.push(newDept);
  res.json(newDept);
});

app.get('/api/sections', async (req, res) => {
  if (isMongoConnected) return res.json(await Section.find());
  res.json(localData.sections || []);
});

app.post('/api/sections', async (req, res) => {
  const newSect = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  if (isMongoConnected) await Section.create(newSect);
  if (!localData.sections) localData.sections = [];
  localData.sections.push(newSect);
  res.json(newSect);
});

app.get('/api/chats', async (req, res) => {
  if (isMongoConnected) return res.json(await Chat.find());
  res.json(localData.chats || []);
});

app.post('/api/chats', async (req, res) => {
  const newChat = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
  if (isMongoConnected) await Chat.create(newChat);
  if (!localData.chats) localData.chats = [];
  localData.chats.push(newChat);
  res.json(newChat);
});

app.get('/api/messages/:chatId', async (req, res) => {
  if (isMongoConnected) return res.json(await Message.find({ chatId: req.params.chatId }));
  res.json((localData.messages || []).filter((m: any) => m.chatId === req.params.chatId));
});

app.post('/api/messages', async (req, res) => {
  const newMessage = { ...req.body, id: Math.random().toString(36).substr(2, 9), timestamp: new Date() };
  if (isMongoConnected) await Message.create(newMessage);
  if (!localData.messages) localData.messages = [];
  localData.messages.push(newMessage);
  res.json(newMessage);
});

// الحذف (الجذري)
app.delete('/api/users/:uid', async (req, res) => {
  if (isMongoConnected) await User.deleteOne({ uid: req.params.uid });
  localData.users = localData.users.filter((u: any) => u.uid !== req.params.uid);
  res.json({ success: true });
});

app.delete('/api/departments/:id', async (req, res) => {
  if (isMongoConnected) await Department.deleteOne({ id: req.params.id });
  localData.departments = localData.departments.filter((d: any) => d.id !== req.params.id);
  res.json({ success: true });
});

// رفع الملفات
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file');
  res.json({ url: `/uploads/${req.file.filename}` });
});

// التصفير (Reset)
app.post('/api/settings/reset', async (req, res) => {
  if (isMongoConnected) {
    await User.deleteMany({ role: { $ne: 'super_admin' } });
    await Department.deleteMany({});
    await Section.deleteMany({});
    await Chat.deleteMany({});
    await Message.deleteMany({});
  }
  localData = { ...localData, departments: [], sections: [], chats: [], messages: [] };
  res.json({ success: true });
});

// Production serving
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api/')) res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  app.listen(3000);
}

export default app;
