export type UserRole = 'super_admin' | 'dept_manager' | 'sect_manager' | 'employee';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  departmentId?: string;
  sectionId?: string;
  createdAt: any;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  createdAt: any;
}

export interface Section {
  id: string;
  name: string;
  departmentId: string;
  managerId?: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  participants: string[];
  name?: string;
  departmentId?: string;
  sectionId?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: any;
  };
  updatedAt: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  status: 'sent' | 'delivered' | 'seen';
  createdAt: any;
}

export interface OfficialDocument {
  id: string;
  docNumber: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  attachments: string[];
  signature: string;
  status: 'sent' | 'received' | 'archived';
  chatId?: string;
  createdAt: any;
}

export interface SystemSettings {
  siteName: string;
  updatedAt: any;
}
