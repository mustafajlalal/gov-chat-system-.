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

const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initial data structure for fallback
const initialData = {
  users: [
    {
      uid: 'admin-uid',
      email: 'superadmin@gov.iq',
      password: 'Admin@2026',
      displayName: 'المدير العام',
      role: 'super_admin',
      createdAt: new Date().toISOString()
    }
  ],
  chats: [],
  messages: [],
  documents: [],
  departments: [
    { id: 'dept-1', name: 'قسم تكنولوجيا المعلومات', managerId: 'manager-1', createdAt: new Date().toISOString() }
  ],
  sections: [],
  settings: { siteName: 'نظام المراسلات الحكومي' }
};

let isMongoConnected = false;
let localData: any = null;

function loadLocalData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  return initialData;
}

function saveLocalData() {
  if (localData) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2));
  }
}

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not found. Using local JSON storage.');
    localData = loadLocalData();
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    isMongoConnected = true;
    console.log('Connected to MongoDB');
    
    // Seed initial data if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial data...');
      await User.create(initialData.users);
      await Department.create(initialData.departments);
      await Setting.create(initialData.settings);
    }
  } catch (err) {
    console.error('MongoDB connection error. Falling back to local storage:', err);
    localData = loadLocalData();
  }
}

async function startServer() {
  await connectDB();
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
  app.use(express.json());
  app.use('/uploads', express.static(UPLOADS_DIR));

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({ storage });

  // API Routes
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (isMongoConnected) {
      const user = await User.findOne({ email, password });
      if (user) {
        const userObj = user.toObject();
        delete userObj.password;
        res.json({ user: userObj });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      const user = localData.users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  });

  app.get('/api/users', async (req, res) => {
    if (isMongoConnected) {
      const users = await User.find({}, '-password');
      res.json(users);
    } else {
      const usersWithoutPasswords = localData.users.map(({ password, ...u }: any) => u);
      res.json(usersWithoutPasswords);
    }
  });

  app.get('/api/departments', async (req, res) => {
    if (isMongoConnected) {
      const depts = await Department.find();
      res.json(depts);
    } else {
      res.json(localData.departments);
    }
  });

  app.post('/api/departments', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (isMongoConnected) {
      const newDept = await Department.create({ ...req.body, id });
      res.json(newDept);
    } else {
      const newDept = { ...req.body, id, createdAt: new Date().toISOString() };
      localData.departments.push(newDept);
      saveLocalData();
      res.json(newDept);
    }
  });

  app.delete('/api/departments/:id', async (req, res) => {
    if (isMongoConnected) {
      await Department.deleteOne({ id: req.params.id });
    } else {
      localData.departments = localData.departments.filter((d: any) => d.id !== req.params.id);
      saveLocalData();
    }
    res.json({ success: true });
  });

  app.get('/api/sections', async (req, res) => {
    if (isMongoConnected) {
      const sects = await Section.find();
      res.json(sects);
    } else {
      res.json(localData.sections || []);
    }
  });

  app.post('/api/sections', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (isMongoConnected) {
      const newSect = await Section.create({ ...req.body, id });
      res.json(newSect);
    } else {
      const newSect = { ...req.body, id, createdAt: new Date().toISOString() };
      if (!localData.sections) localData.sections = [];
      localData.sections.push(newSect);
      saveLocalData();
      res.json(newSect);
    }
  });

  app.delete('/api/sections/:id', async (req, res) => {
    if (isMongoConnected) {
      await Section.deleteOne({ id: req.params.id });
    } else {
      localData.sections = (localData.sections || []).filter((s: any) => s.id !== req.params.id);
      saveLocalData();
    }
    res.json({ success: true });
  });

  app.get('/api/settings', async (req, res) => {
    if (isMongoConnected) {
      let settings = await Setting.findOne();
      if (!settings) settings = await Setting.create(initialData.settings);
      res.json(settings);
    } else {
      res.json(localData.settings || initialData.settings);
    }
  });

  app.post('/api/settings', async (req, res) => {
    if (isMongoConnected) {
      const settings = await Setting.findOneAndUpdate({}, req.body, { upsert: true, new: true });
      res.json(settings);
    } else {
      localData.settings = req.body;
      saveLocalData();
      res.json(localData.settings);
    }
  });

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post('/api/users', async (req, res) => {
    const { email, password, displayName, role, departmentId, sectionId } = req.body;
    const uid = Math.random().toString(36).substr(2, 9);

    if (isMongoConnected) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      const newUser = await User.create({ uid, email, password: password || 'Password@123', displayName, role, departmentId, sectionId });
      res.json(newUser);
    } else {
      if (localData.users.find((u: any) => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
      const newUser = { uid, email, password: password || 'Password@123', displayName, role, departmentId, sectionId, createdAt: new Date().toISOString() };
      localData.users.push(newUser);
      saveLocalData();
      res.json(newUser);
    }
  });

  app.delete('/api/users/:uid', async (req, res) => {
    if (isMongoConnected) {
      await User.deleteOne({ uid: req.params.uid });
    } else {
      localData.users = localData.users.filter((u: any) => u.uid !== req.params.uid);
      saveLocalData();
    }
    res.json({ success: true });
  });

  app.patch('/api/users/:uid', async (req, res) => {
    if (isMongoConnected) {
      const updated = await User.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
      if (updated) res.json(updated);
      else res.status(404).json({ error: 'User not found' });
    } else {
      const index = localData.users.findIndex((u: any) => u.uid === req.params.uid);
      if (index !== -1) {
        localData.users[index] = { ...localData.users[index], ...req.body };
        saveLocalData();
        res.json(localData.users[index]);
      } else res.status(404).json({ error: 'User not found' });
    }
  });

  app.get('/api/chats', async (req, res) => {
    if (isMongoConnected) {
      const chats = await Chat.find();
      res.json(chats);
    } else {
      res.json(localData.chats || []);
    }
  });

  app.post('/api/chats', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (isMongoConnected) {
      const newChat = await Chat.create({ ...req.body, id });
      res.json(newChat);
    } else {
      const newChat = { ...req.body, id, createdAt: new Date().toISOString() };
      if (!localData.chats) localData.chats = [];
      localData.chats.push(newChat);
      saveLocalData();
      res.json(newChat);
    }
  });

  app.get('/api/messages/:chatId', async (req, res) => {
    if (isMongoConnected) {
      const messages = await Message.find({ chatId: req.params.chatId });
      res.json(messages);
    } else {
      const messages = (localData.messages || []).filter((m: any) => m.chatId === req.params.chatId);
      res.json(messages);
    }
  });

  app.post('/api/messages', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (isMongoConnected) {
      const newMessage = await Message.create({ ...req.body, id });
      res.json(newMessage);
    } else {
      const newMessage = { ...req.body, id, timestamp: new Date().toISOString() };
      if (!localData.messages) localData.messages = [];
      localData.messages.push(newMessage);
      saveLocalData();
      res.json(newMessage);
    }
  });

  app.get('/api/documents', async (req, res) => {
    if (isMongoConnected) {
      const docs = await Document.find();
      res.json(docs);
    } else {
      res.json(localData.documents || []);
    }
  });

  app.post('/api/documents', async (req, res) => {
    const id = Math.random().toString(36).substr(2, 9);
    if (isMongoConnected) {
      const newDoc = await Document.create({ ...req.body, id });
      res.json(newDoc);
    } else {
      const newDoc = { ...req.body, id, createdAt: new Date().toISOString() };
      if (!localData.documents) localData.documents = [];
      localData.documents.push(newDoc);
      saveLocalData();
      res.json(newDoc);
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
