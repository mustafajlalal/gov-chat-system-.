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

let isMongoConnected = false;

async function connectDB() {
  if (isMongoConnected && mongoose.connection.readyState === 1) return;
  
  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing from environment variables!');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    isMongoConnected = true;
    console.log('SUCCESS: Connected to MongoDB Atlas');
    
    // Seed data immediately on connection
    const userCount = await User.countDocuments();
    console.log(`Current user count in DB: ${userCount}`);
    
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial admin user...');
      await User.create({
        uid: 'admin-uid',
        email: 'superadmin@gov.iq',
        password: 'Admin@2026',
        displayName: 'المدير العام',
        role: 'super_admin',
        createdAt: new Date()
      });
      console.log('Admin user created successfully.');
    }
  } catch (err) {
    console.error('FAILED to connect to MongoDB:', err);
    isMongoConnected = false;
  }
}

const app = express();
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login request received for: ${email}`);
  
  try {
    await connectDB(); // Ensure connection before login check

    if (!isMongoConnected) {
      console.error('Database not connected. Cannot perform login.');
      return res.status(500).json({ error: 'خطأ في الاتصال بقاعدة البيانات' });
    }

    const user = await User.findOne({ email, password });
    
    if (user) {
      const userObj = user.toObject();
      delete userObj.password;
      console.log(`Login SUCCESS for: ${email}`);
      return res.json({ user: userObj });
    } else {
      console.warn(`Login FAILED for: ${email} - User not found or password mismatch`);
      return res.status(401).json({ error: 'البريد أو كلمة المرور غير صحيحة' });
    }
  } catch (error) {
    console.error('Login Route Error:', error);
    res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
  }
});

// Other routes (Simplified for diagnosis)
app.get('/api/users', async (req, res) => {
  await connectDB();
  const users = await User.find({}, '-password');
  res.json(users);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  // Local Dev
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
  app.listen(3000, () => console.log('Dev server: http://localhost:3000'));
}

export default app;
