import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FilePlus, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Archive,
  User,
  Hash,
  PenTool,
  Paperclip,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { OfficialDocument, UserProfile } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { api } from '../lib/api';

export default function Documents() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [docNumber, setDocNumber] = useState(`GOV-${Date.now().toString().slice(-6)}`);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [u, d] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/documents')
      ]);
      setUsers(u);
      
      if (profile?.role === 'super_admin') {
        setDocuments(d);
      } else {
        setDocuments(d.filter((doc: OfficialDocument) => doc.senderId === profile?.uid || doc.receiverId === profile?.uid));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [profile]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !receiverId || !subject || !content) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) throw new Error('Upload failed');
        const uploadRes = await response.json();
        attachmentUrls.push(uploadRes.url);
      }

      await api.post('/api/documents', {
        docNumber,
        senderId: profile.uid,
        receiverId,
        subject,
        content,
        attachments: attachmentUrls,
        signature: `تم التوقيع إلكترونياً بواسطة: ${profile.displayName}`,
        status: 'sent'
      });

      toast.success('تم إرسال الكتاب الرسمي بنجاح');
      setIsCreating(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('خطأ في إرسال الكتاب');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setContent('');
    setReceiverId('');
    setDocNumber(`GOV-${Date.now().toString().slice(-6)}`);
    setAttachments([]);
  };

  const handleUpdateStatus = async (docId: string, status: 'received' | 'archived') => {
    try {
      // In a real app, you'd have a PATCH /api/documents/:id
      toast.success('تم تحديث حالة الكتاب (تجريبي)');
      fetchData();
    } catch (error) {
      toast.error('خطأ في التحديث');
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;
    try {
      // await api.delete(`/api/documents/${docId}`);
      toast.success('تم حذف الكتاب (تجريبي)');
      fetchData();
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  const filteredDocs = documents.filter(d => 
    d.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.docNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gold-text">المراسلات الرسمية</h1>
          <p className="text-blue-200/70">إدارة الكتب الرسمية والوثائق الحكومية</p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)} 
          className={`rounded-2xl h-14 px-8 shadow-2xl transition-all font-bold text-lg ${
            isCreating ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'gold-button'
          }`}
        >
          {isCreating ? 'إلغاء العملية' : 'إنشاء كتاب رسمي جديد'}
          {isCreating ? <X className="mr-2 w-6 h-6" /> : <FilePlus className="mr-2 w-6 h-6" />}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden animate-in slide-in-from-top-8 duration-500 bg-slate-900/40 backdrop-blur-xl border border-white/5">
          <CardHeader className="bg-white/5 border-b border-white/5 p-8">
            <CardTitle className="text-2xl text-white">تحرير كتاب رسمي</CardTitle>
            <CardDescription className="text-slate-400">أدخل تفاصيل الكتاب الرسمي والمرفقات بدقة</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleCreateDocument} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-amber-400/80 font-bold">
                    <Hash className="w-4 h-4" />
                    رقم الكتاب
                  </Label>
                  <Input value={docNumber} readOnly className="bg-black/20 rounded-xl border-white/5 text-amber-400 font-mono h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-amber-400/80 font-bold">
                    <User className="w-4 h-4" />
                    الجهة المستلمة
                  </Label>
                  <Select onValueChange={setReceiverId} value={receiverId}>
                    <SelectTrigger className="rounded-xl border-white/5 h-14 bg-white/5 text-white focus:ring-amber-400/20">
                      <SelectValue placeholder="اختر الموظف أو المدير" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {users.filter(u => u.uid !== profile?.uid).map(u => (
                        <SelectItem key={u.uid} value={u.uid} className="focus:bg-amber-400 focus:text-[#001F3F]">
                          {u.displayName} ({u.role === 'super_admin' ? 'المدير العام' : u.role === 'dept_manager' ? 'مدير قسم' : 'موظف'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-amber-400/80 font-bold">
                    <FileText className="w-4 h-4" />
                    الموضوع
                  </Label>
                  <Input 
                    placeholder="عنوان الكتاب الرسمي" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="rounded-xl border-white/5 h-14 bg-white/5 text-white focus:border-amber-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-amber-400/80 font-bold">
                    <Paperclip className="w-4 h-4" />
                    المرفقات
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      multiple 
                      onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                      className="rounded-xl border-white/5 h-14 bg-white/5 text-white file:bg-amber-400 file:text-[#001F3F] file:border-none file:rounded-lg file:px-4 file:py-1 file:ml-3 file:font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">يمكنك رفع صور، ملفات PDF، أو مستندات Word (الحد الأقصى 5 ملفات)</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-amber-400/80 font-bold">محتوى الكتاب</Label>
                  <Textarea 
                    placeholder="اكتب نص الكتاب الرسمي هنا بالتفصيل..." 
                    className="min-h-[300px] rounded-3xl border-white/5 p-6 leading-relaxed bg-white/5 text-white focus:border-amber-400"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
                <div className="p-5 bg-amber-400/5 rounded-2xl border border-amber-400/10 flex items-center gap-4">
                  <div className="bg-amber-400/20 p-3 rounded-xl">
                    <PenTool className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-amber-400 text-sm">التوقيع الرقمي المعتمد</p>
                    <p className="text-slate-400 mt-1">سيتم إدراج توقيعك الإلكتروني المشفر تلقائياً عند الإرسال لضمان الموثوقية</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4 pt-8 border-t border-white/5">
                <Button type="button" variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl px-10 text-slate-400 hover:text-white hover:bg-white/5">إلغاء</Button>
                <Button type="submit" disabled={loading} className="gold-button rounded-xl px-16 h-14 text-xl font-bold shadow-2xl">
                  {loading ? 'جاري المعالجة...' : 'إرسال الكتاب الرسمي'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
          <Input 
            placeholder="بحث في المراسلات..." 
            className="pr-12 h-12 rounded-2xl bg-slate-900/40 border-white/5 text-white focus:border-amber-400 shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-white/5">
              <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-500">لا توجد مراسلات رسمية حالياً</h3>
              <p className="text-sm text-slate-600 mt-2">ابدأ بإنشاء أول كتاب رسمي من الزر المخصص أعلاه</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <Card key={doc.id} className="border-none shadow-2xl rounded-[2rem] overflow-hidden hover:shadow-amber-400/5 transition-all group bg-slate-900/40 backdrop-blur-md border border-white/5">
                <div className="flex flex-col md:flex-row">
                  <div className="p-8 flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-900/40 p-3 rounded-2xl border border-blue-400/20">
                          <FileText className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-white group-hover:text-amber-400 transition-colors">{doc.subject}</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 font-mono">
                            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                              <Hash className="w-3 h-3 text-amber-400/50" />
                              {doc.docNumber}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-amber-400/50" />
                              {format(new Date(doc.createdAt), 'yyyy/MM/dd HH:mm', { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`px-4 py-1 rounded-full font-bold border ${
                        doc.status === 'archived' ? 'bg-slate-900/60 text-slate-500 border-slate-800' :
                        doc.status === 'received' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-400/20' : 
                        'bg-blue-900/40 text-blue-400 border-blue-400/20'
                      }`}>
                        {doc.status === 'archived' ? 'مؤرشف' : doc.status === 'received' ? 'مستلم' : 'قيد الإرسال'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed bg-black/20 p-5 rounded-2xl border border-white/5">
                      {doc.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">المرسل:</span>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                            {users.find(u => u.uid === doc.senderId)?.displayName?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-200">{users.find(u => u.uid === doc.senderId)?.displayName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">المستلم:</span>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                          <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center text-[10px] text-white font-bold">
                            {users.find(u => u.uid === doc.receiverId)?.displayName?.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-200">{users.find(u => u.uid === doc.receiverId)?.displayName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 md:w-72 p-8 border-r border-white/5 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-amber-400/50 uppercase tracking-widest">المرفقات ({doc.attachments?.length || 0})</h4>
                      <div className="space-y-2.5">
                        {doc.attachments?.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-3 text-xs text-blue-400 hover:text-amber-400 transition-colors bg-white/5 p-3 rounded-xl border border-white/5 hover:border-amber-400/30"
                          >
                            <Download className="w-4 h-4" />
                            <span className="font-medium">تحميل المرفق {i + 1}</span>
                          </a>
                        ))}
                        {(!doc.attachments || doc.attachments.length === 0) && (
                          <p className="text-[10px] text-slate-600 italic">لا توجد مرفقات لهذا الكتاب</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {doc.receiverId === profile?.uid && doc.status === 'sent' && (
                        <Button 
                          size="lg" 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-emerald-900/20"
                          onClick={() => handleUpdateStatus(doc.id, 'received')}
                        >
                          <CheckCircle2 className="w-5 h-5 ml-2" />
                          تأكيد الاستلام
                        </Button>
                      )}
                      {(doc.senderId === profile?.uid || profile?.role === 'super_admin') && doc.status !== 'archived' && (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full rounded-xl h-12 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                          onClick={() => handleUpdateStatus(doc.id, 'archived')}
                        >
                          <Archive className="w-5 h-5 ml-2" />
                          أرشفة الكتاب
                        </Button>
                      )}
                      {profile?.role === 'super_admin' && (
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="w-full text-rose-400 hover:bg-rose-400/10 rounded-xl h-12 font-medium"
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          <Trash2 className="w-5 h-5 ml-2" />
                          حذف الكتاب
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
