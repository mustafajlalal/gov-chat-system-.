import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  MoreVertical, 
  Search, 
  Plus,
  Check,
  CheckCheck,
  Trash2,
  X,
  MessageSquare,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Chat, Message, UserProfile } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../lib/api';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function ChatPage() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isPrivateDialogOpen, setIsPrivateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [u, c] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/chats')
      ]);
      setUsers(u);
      setChats(c.filter((chat: Chat) => chat.participants.includes(profile?.uid || '')));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      try {
        const msgs = await api.get(`/api/messages/${activeChat.id}`);
        setMessages(msgs);
      } catch (e) {
        console.error(e);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeChat || !profile) return;

    const content = newMessage;
    setNewMessage('');

    try {
      await api.post('/api/messages', {
        chatId: activeChat.id,
        senderId: profile.uid,
        content,
        type: 'text',
        status: 'sent'
      });
      // Refresh messages
      const msgs = await api.get(`/api/messages/${activeChat.id}`);
      setMessages(msgs);
    } catch (error) {
      toast.error('خطأ في إرسال الرسالة');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat || !profile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const uploadRes = await response.json();
      const url = uploadRes.url;

      await api.post('/api/messages', {
        chatId: activeChat.id,
        senderId: profile.uid,
        content: `أرسل ملفاً: ${file.name}`,
        type: 'file',
        fileUrl: url,
        fileName: file.name,
        fileType: file.type,
        status: 'sent'
      });
      toast.success('تم رفع الملف بنجاح');
    } catch (error) {
      console.error(error);
      toast.error('خطأ في رفع الملف');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startNewChat = async (targetUser: UserProfile) => {
    if (!profile) return;
    const existing = chats.find(c => c.type === 'private' && c.participants.includes(targetUser.uid));
    if (existing) {
      setActiveChat(existing);
      return;
    }

    try {
      const newChat = await api.post('/api/chats', {
        type: 'private',
        participants: [profile.uid, targetUser.uid],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setActiveChat(newChat);
      fetchData();
    } catch (error) {
      toast.error('خطأ في بدء المحادثة');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المحادثة بالكامل؟')) return;
    try {
      // await api.delete(`/api/chats/${chatId}`);
      toast.success('تم حذف المحادثة (تجريبي)');
      if (activeChat?.id === chatId) setActiveChat(null);
      fetchData();
    } catch (error) {
      toast.error('خطأ في حذف المحادثة');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsers.length === 0 || !profile) return;
    try {
      const newChat = await api.post('/api/chats', {
        type: 'group',
        name: groupName,
        participants: [profile.uid, ...selectedUsers],
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setActiveChat(newChat);
      setIsGroupDialogOpen(false);
      setGroupName('');
      setSelectedUsers([]);
      fetchData();
      toast.success('تم إنشاء المجموعة بنجاح');
    } catch (error) {
      toast.error('خطأ في إنشاء المجموعة');
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name;
    const otherId = chat.participants.find(p => p !== profile?.uid);
    const otherUser = users.find(u => u.uid === otherId);
    return otherUser?.displayName || 'مستخدم غير معروف';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') return null;
    const otherId = chat.participants.find(p => p !== profile?.uid);
    const otherUser = users.find(u => u.uid === otherId);
    return otherUser?.displayName?.charAt(0) || '?';
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4 animate-in fade-in duration-500">
      {/* Chat List Sidebar */}
      <Card className="w-80 border-none shadow-2xl rounded-3xl flex flex-col overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5">
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl text-white">المحادثات</h2>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="rounded-xl bg-amber-400 text-[#001F3F] hover:bg-amber-300">
                    <Plus className="w-5 h-5" />
                  </Button>
                }
              />
              <DropdownMenuContent className="bg-slate-900 border-white/10 text-white rounded-xl" align="end">
                <DropdownMenuItem 
                  className="cursor-pointer focus:bg-amber-400 focus:text-[#001F3F] font-bold"
                  onClick={() => setIsPrivateDialogOpen(true)}
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  محادثة فردية
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer focus:bg-amber-400 focus:text-[#001F3F] font-bold"
                  onClick={() => setIsGroupDialogOpen(true)}
                >
                  <Users className="w-4 h-4 ml-2" />
                  محادثة جماعية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Private Chat Dialog */}
            <Dialog open={isPrivateDialogOpen} onOpenChange={setIsPrivateDialogOpen}>
              <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl gold-text">بدء محادثة فردية</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label className="mb-2 block">اختر الموظف</Label>
                  <ScrollArea className="h-64 rounded-xl border border-white/5 p-2">
                    {users.filter(u => u.uid !== profile?.uid).map(u => (
                      <div 
                        key={u.uid} 
                        className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
                        onClick={() => {
                          startNewChat(u);
                          setIsPrivateDialogOpen(false);
                        }}
                      >
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarFallback className="bg-slate-800 text-slate-400">{u.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-200 group-hover:text-white">{u.displayName}</span>
                          <span className="text-[10px] text-slate-500">{u.role === 'super_admin' ? 'المدير العام' : u.role === 'dept_manager' ? 'مدير قسم' : 'موظف'}</span>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>

            {/* Group Chat Dialog */}
            <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
              <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl gold-text">إنشاء مجموعة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم المجموعة</Label>
                    <Input 
                      placeholder="مثلاً: فريق البرمجيات" 
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="rounded-xl bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اختر الأعضاء</Label>
                    <ScrollArea className="h-48 rounded-xl border border-white/5 p-2">
                      {users.filter(u => u.uid !== profile?.uid).map(u => (
                        <div key={u.uid} className="flex items-center space-x-3 space-x-reverse p-2 hover:bg-white/5 rounded-lg">
                          <Checkbox 
                            id={`user-${u.uid}`} 
                            checked={selectedUsers.includes(u.uid)}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedUsers([...selectedUsers, u.uid]);
                              else setSelectedUsers(selectedUsers.filter(id => id !== u.uid));
                            }}
                          />
                          <Label htmlFor={`user-${u.uid}`} className="flex-1 cursor-pointer">{u.displayName}</Label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateGroup} className="w-full gold-button rounded-xl">إنشاء المجموعة</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="بحث..." 
              className="pr-9 rounded-xl bg-white/5 border-white/5 h-10 text-white focus:border-amber-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chats.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-sm">لا توجد محادثات نشطة</div>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                  activeChat?.id === chat.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Avatar className="h-12 w-12 border-2 border-amber-400/20 shadow-sm">
                  <AvatarFallback className="bg-blue-900 text-blue-400 font-bold">
                    {getChatAvatar(chat)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className={`font-bold truncate ${activeChat?.id === chat.id ? 'text-amber-400' : 'text-white'}`}>{getChatName(chat)}</h3>
                    <span className="text-[10px] text-slate-500">
                      {chat.updatedAt ? format(new Date(chat.updatedAt), 'HH:mm', { locale: ar }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{chat.lastMessage?.content || 'ابدأ المحادثة الآن...'}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2 bg-white/5" />
          <div className="p-4">
            <h4 className="text-[10px] font-bold text-amber-400/50 uppercase tracking-widest mb-3">الموظفين</h4>
            <div className="space-y-2">
              {users.filter(u => u.uid !== profile?.uid).map(u => (
                <div 
                  key={u.uid} 
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
                  onClick={() => startNewChat(u)}
                >
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-slate-800 text-slate-400 text-[10px]">{u.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">{u.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 border-none shadow-2xl rounded-3xl flex flex-col overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-amber-400/20">
                  <AvatarFallback className="bg-blue-900 text-blue-400 font-bold">
                    {getChatAvatar(activeChat)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-white">{getChatName(activeChat)}</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] text-slate-400">نشط الآن</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {profile?.role === 'super_admin' && (
                  <Button variant="ghost" size="icon" className="text-rose-400 hover:bg-rose-400/10 rounded-xl" onClick={() => handleDeleteChat(activeChat.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white rounded-xl">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-black/10">
              <div className="space-y-6">
                {messages.map((m, i) => {
                  const isMe = m.senderId === profile?.uid;
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                      <div className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} max-w-[70%]`}>
                        <div className={isMe ? 'chat-bubble-sent shadow-lg' : 'chat-bubble-received shadow-lg'}>
                          {m.type === 'file' ? (
                            <a href={m.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                              <div className={`p-2 rounded-xl ${isMe ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                {m.fileType?.includes('image') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold truncate">{m.fileName}</span>
                                <span className="text-[10px] opacity-60">انقر للتحميل</span>
                              </div>
                            </a>
                          ) : (
                            <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 px-1">
                          <span className="text-[9px] text-slate-500 font-mono">
                            {m.createdAt ? format(new Date(m.createdAt), 'HH:mm', { locale: ar }) : ''}
                          </span>
                          {isMe && (
                            m.status === 'seen' ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" /> : <Check className="w-3.5 h-3.5 text-slate-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </div>
                <Input 
                  placeholder="اكتب رسالتك هنا..." 
                  className="flex-1 h-14 rounded-2xl bg-white/5 border-white/5 text-white focus:border-amber-400 focus-visible:ring-amber-400/10"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-14 w-14 rounded-2xl gold-button shadow-xl"
                  disabled={!newMessage.trim() || loading}
                >
                  <Send className="w-6 h-6" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-6">
            <div className="bg-white/5 p-8 rounded-full border border-white/5 shadow-inner">
              <MessageSquare className="w-20 h-20 text-amber-400/20" />
            </div>
            <div className="text-center max-w-xs">
              <h3 className="text-xl font-bold text-white gold-text">ابدأ محادثة جديدة</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">اختر موظفاً من القائمة الجانبية لبدء المراسلة الفورية والآمنة</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
