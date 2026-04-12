import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  role: { type: String, required: true },
  departmentId: String,
  sectionId: String,
  createdAt: { type: Date, default: Date.now }
});

const DepartmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  managerId: String,
  createdAt: { type: Date, default: Date.now }
});

const SectionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  departmentId: { type: String, required: true },
  managerId: String,
  createdAt: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, enum: ['private', 'group'], required: true },
  name: String,
  participants: [String],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'text' },
  fileUrl: String,
  fileName: String,
  fileType: String,
  status: { type: String, default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});

const DocumentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  docNumber: String,
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  attachments: [String],
  signature: String,
  status: { type: String, default: 'sent' },
  createdAt: { type: Date, default: Date.now }
});

const SettingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'نظام المراسلات الحكومي' }
});

export const User = mongoose.model('User', UserSchema);
export const Department = mongoose.model('Department', DepartmentSchema);
export const Section = mongoose.model('Section', SectionSchema);
export const Chat = mongoose.model('Chat', ChatSchema);
export const Message = mongoose.model('Message', MessageSchema);
export const Document = mongoose.model('Document', DocumentSchema);
export const Setting = mongoose.model('Setting', SettingSchema);
