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
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      return initialData;
    }
  }
  return initialData;
}

function saveLocalData() {
  if (localData && process.env.NODE_ENV !== 'production') {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(localData, null, 2));
    } catch (e) {
      console.error('Could not save local data:', e);
    }
  }
}

async function connectDB() {
  if (isMongoConnected) return;
  
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI not found. Using local data.');
    localData = loadLocalData();
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isMongoConnected = true;
    console.log('Connected to MongoDB');
    
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding initial data...');
      await User.insertMany(initialData.users);
      await Department.insertMany(initialData.departments);
      await Setting.create(initialData.settings);
    }
  } catch (err) {
    console.error('MongoDB error, falling back to local data:', err);
    isMongoConnected = false;
    localData = loadLocalData();
  }
}

const app = express();

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
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
  console.log(`Login attempt for: ${email}`);
  
  try {
    if (isMongoConnected) {
      const user = await User.findOne({ email, password });
      if (user) {
        const userObj = user.toObject();
        delete userObj.password;
        console.log('Login successful via MongoDB');
        return res.json({ user: userObj });
      }
    } else {
      const user = localData.users.find((u: any) => u.email === email && u.password === password);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        console.log('Login successful via Local Data');
        return res.json({ user: userWithoutPassword });
      }
    }
    console.warn('Login failed: Invalid credentials');
    res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

app.get('/api/settings', async (req, res) => {
  if (isMongoConnected) {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create(initialData.settings);
    res.json(settings);
  } else {
    res.json(localData.settings || initialData.settings);
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

// Vite middleware for local development
if (process.env.NODE_ENV !== 'production') {
  setupDevServer();
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

async function setupDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dev server: http://localhost:${PORT}`);
  });
}

export default app;
