import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  Building2,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    chats: 0,
    docs: 0,
    depts: 0
  });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, chats, docs, depts] = await Promise.all([
          api.get('/api/users'),
          api.get('/api/chats'),
          api.get('/api/documents'),
          api.get('/api/departments')
        ]);
        
        setStats({
          users: users.length,
          chats: chats.length,
          docs: docs.length,
          depts: depts.length
        });
        
        // Sort docs by date and take top 5
        const sortedDocs = [...docs].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5);
        
        setRecentDocs(sortedDocs);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s for "real-time" feel
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'إجمالي الموظفين', value: stats.users, icon: Users, color: 'bg-blue-600', trend: '+12%' },
    { title: 'المحادثات النشطة', value: stats.chats, icon: MessageSquare, color: 'bg-emerald-600', trend: '+5%' },
    { title: 'المراسلات الرسمية', value: stats.docs, icon: FileText, color: 'bg-purple-600', trend: '+18%' },
    { title: 'الأقسام الإدارية', value: stats.depts, icon: Building2, color: 'bg-amber-600', trend: '0%' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gold-text">أهلاً بك، {profile?.displayName}</h1>
          <p className="text-blue-200/70">إليك نظرة سريعة على نشاط النظام اليوم</p>
        </div>
        <div className="flex gap-3">
          <Link to="/chat">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 shadow-lg shadow-emerald-900/20">
              <MessageSquare className="w-4 h-4 ml-2" />
              محادثة جديدة
            </Button>
          </Link>
          <Link to="/documents">
            <Button className="gold-button rounded-xl px-6 shadow-lg">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء كتاب رسمي
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5 group hover:border-amber-400/30 transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`${stat.color} p-3 rounded-2xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/5 text-amber-400 border-none">
                  <TrendingUp className="w-3 h-3 ml-1" />
                  {stat.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-slate-400 text-sm font-medium">{stat.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white group-hover:gold-text transition-colors">{stat.value}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">آخر المراسلات الرسمية</CardTitle>
              <CardDescription className="text-slate-400">الكتب والوثائق الصادرة والواردة مؤخراً</CardDescription>
            </div>
            <Link to="/documents" className="text-amber-400 text-sm font-medium flex items-center gap-1 hover:underline">
              عرض الكل
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.length === 0 ? (
                <div className="text-center py-12 text-slate-500">لا توجد مراسلات حالياً</div>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-amber-400/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-900/30 p-2 rounded-xl border border-blue-400/20">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{doc.subject}</h4>
                        <p className="text-xs text-slate-400">رقم الكتاب: {doc.docNumber}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge className={
                        doc.status === 'archived' ? 'bg-slate-700 text-slate-300' :
                        doc.status === 'received' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-400/20' : 'bg-blue-900/40 text-blue-400 border border-blue-400/20'
                      }>
                        {doc.status === 'archived' ? 'مؤرشف' : doc.status === 'received' ? 'مستلم' : 'قيد الإرسال'}
                      </Badge>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5">
          <CardHeader>
            <CardTitle className="text-white">إجراءات سريعة</CardTitle>
            <CardDescription className="text-slate-400">الوصول السريع للمهام المتكررة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-amber-400/30 group">
              <div className="bg-blue-900/30 p-2 rounded-xl group-hover:bg-blue-800/40">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-bold">إضافة موظف جديد</span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-amber-400/30 group">
              <div className="bg-amber-900/30 p-2 rounded-xl group-hover:bg-amber-800/40">
                <Building2 className="w-4 h-4 text-amber-400" />
              </div>
              <span className="font-bold">إدارة الأقسام</span>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-amber-400/30 group">
              <div className="bg-emerald-900/30 p-2 rounded-xl group-hover:bg-emerald-800/40">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold">إنشاء مجموعة عمل</span>
            </Button>
            
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl text-white relative overflow-hidden shadow-xl border border-white/10">
              <div className="relative z-10">
                <h4 className="font-bold text-lg">تحتاج مساعدة؟</h4>
                <p className="text-xs text-blue-100 mt-2 leading-relaxed">تواصل مع الدعم الفني للنظام في أي وقت للحصول على المساعدة</p>
                <Button className="mt-4 bg-amber-400 text-[#001F3F] hover:bg-amber-300 rounded-xl h-10 px-6 text-xs font-bold shadow-lg">
                  فتح تذكرة دعم
                </Button>
              </div>
              <ShieldCheck className="absolute -bottom-6 -left-6 w-32 h-32 text-white/10 rotate-12" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
