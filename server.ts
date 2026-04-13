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

// تأكيد وجود مجلد الرفع
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

// وظيفة الاتصال القوي بقاعدة البيانات
async function connectDB() {
  if (isMongoConnected && mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isMongoConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    isMongoConnected = false;
  }
}

const app = express();
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// إعداد رفع الملفات (خاصية تحميل الملفات)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- الأوامر الجبارة (كل العمليات) ---

// 1. تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) {
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ user: userObj });
  } else {
    res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  }
});

// 2. إدارة المستخدمين (إضافة، حذف، جلب)
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '-password');
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, displayName, role, departmentId, sectionId } = req.body;
    const uid = Math.random().toString(36).substr(2, 9);
    const newUser = await User.create({ uid, email, password: password || 'Admin@123', displayName, role, departmentId, sectionId });
    res.json(newUser);
  } catch (err) {
    res.status(400).json({ error: 'خطأ في إضافة المستخدم أو البريد موجود مسبقاً' });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  await User.deleteOne({ uid: req.params.uid });
  res.json({ success: true });
});

// 3. الأقسام (خاصية الحذف والإضافة)
app.get('/api/departments', async (req, res) => {
  const depts = await Department.find();
  res.json(depts);
});

app.post('/api/departments', async (req, res) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newDept = await Department.create({ ...req.body, id });
  res.json(newDept);
});

app.delete('/api/departments/:id', async (req, res) => {
  await Department.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

// 4. الدردشات والرسائل (خاصية الدردشة)
app.get('/api/chats', async (req, res) => {
  const chats = await Chat.find();
  res.json(chats);
});

app.post('/api/chats', async (req, res) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newChat = await Chat.create({ ...req.body, id });
  res.json(newChat);
});

app.get('/api/messages/:chatId', async (req, res) => {
  const messages = await Message.find({ chatId: req.params.chatId });
  res.json(messages);
});

app.post('/api/messages', async (req, res) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newMessage = await Message.create({ ...req.body, id });
  res.json(newMessage);
});

// 5. رفع الملفات والمستندات
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/documents', async (req, res) => {
  const docs = await Document.find();
  res.json(docs);
});

app.post('/api/documents', async (req, res) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newDoc = await Document.create({ ...req.body, id });
  res.json(newDoc);
});

// 6. الإعدادات (خاصية التصفير/التعديل)
app.get('/api/settings', async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({ siteName: 'نظام المراسلات الحكومي' });
  res.json(settings);
});

app.post('/api/settings', async (req, res) => {
  const settings = await Setting.findOneAndUpdate({}, req.body, { upsert: true, new: true });
  res.json(settings);
});

// --- التجهيز للإنتاج ---
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
}

export default app;
