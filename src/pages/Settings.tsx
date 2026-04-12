import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ShieldAlert, Save, RefreshCcw, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function Settings() {
  const { profile } = useAuth();
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.get('/api/settings');
        setSiteName(settings.siteName || 'نظام المراسلات الحكومي');
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.post('/api/settings', {
        siteName,
        updatedAt: new Date().toISOString()
      });
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      toast.error('خطأ في حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSite = async () => {
    if (!confirm('تحذير: هذا الإجراء سيقوم بحذف جميع البيانات (المحادثات، المراسلات، الأقسام) ولن يتمكن أحد من استعادتها. هل أنت متأكد؟')) {
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd have a DELETE /api/reset
      toast.success('تم تصفير الموقع بنجاح (تجريبي)');
    } catch (error) {
      console.error(error);
      toast.error('خطأ في تصفير الموقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold gold-text">الإعدادات</h1>
        <p className="text-blue-200/70">تخصيص النظام وإدارة البيانات العامة</p>
      </div>

      <Card className="border-none shadow-2xl rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white">إعدادات المظهر والهوية</CardTitle>
          <CardDescription className="text-slate-400">تغيير اسم النظام والخصائص البصرية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <div className="space-y-3">
            <Label htmlFor="siteName" className="text-amber-400 font-bold">اسم النظام / المؤسسة</Label>
            <Input 
              id="siteName" 
              value={siteName} 
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="نظام المراسلات الحكومي"
              className="rounded-xl h-14 bg-white/5 border-white/10 text-white focus:border-amber-400 text-lg"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-black/20 p-6 rounded-b-3xl border-t border-white/5">
          <Button onClick={handleSaveSettings} disabled={loading} className="gold-button rounded-xl px-10 h-12 font-bold">
            <Save className="w-5 h-5 ml-2" />
            حفظ التغييرات
          </Button>
        </CardFooter>
      </Card>

      {profile?.role === 'super_admin' && (
        <Card className="border-rose-900/30 bg-rose-900/10 shadow-none rounded-3xl overflow-hidden border">
          <CardHeader className="border-b border-rose-900/20">
            <CardTitle className="text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6" />
              منطقة الخطر
            </CardTitle>
            <CardDescription className="text-rose-400/60">إجراءات حساسة تؤثر على كامل النظام</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-black/20 rounded-2xl border border-rose-900/20">
              <div className="bg-rose-900/40 p-4 rounded-xl">
                <RefreshCcw className="w-8 h-8 text-rose-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg">تصفير الموقع بالكامل</h4>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  سيتم حذف جميع المحادثات، المراسلات الرسمية، الأقسام، والشعب. 
                  <span className="font-bold text-rose-400"> لن يتم حذف حسابات المستخدمين.</span>
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleResetSite} 
                disabled={loading}
                className="rounded-xl h-12 px-8 bg-rose-600 hover:bg-rose-700 font-bold"
              >
                تصفير الآن
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-rose-900/20 p-4 flex items-center gap-2 text-xs text-rose-400 font-medium">
            <Info className="w-4 h-4" />
            <span>هذا الإجراء لا يمكن التراجع عنه. يرجى التأكد قبل التنفيذ.</span>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
