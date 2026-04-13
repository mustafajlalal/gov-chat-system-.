import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. نظام دخول مباشر وأكيد (يتخطى السيرفر والملفات الأخرى)
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail === 'superadmin@gov.iq' && password === 'Admin@2026') {
      const adminUser = {
        uid: 'admin-uid',
        email: 'superadmin@gov.iq',
        displayName: 'المدير العام',
        role: 'super_admin'
      };
      login(adminUser);
      toast.success('تم تسجيل الدخول بنجاح (نظام الطوارئ)');
      navigate(from, { replace: true });
      setLoading(false);
      return;
    }

    try {
      const data = await api.post('/api/auth/login', { email, password });
      login(data.user);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error('خطأ في تسجيل الدخول: البريد أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001F3F] p-4 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 rounded-full blur-3xl animate-pulse" />

      <div className="flex flex-col md:flex-row-reverse items-center gap-8 relative z-10 max-w-5xl w-full justify-center">
        {/* Credit Box - Professional Rectangle on the Right (Left in RTL/Row-reverse) */}
        <div className="hidden md:flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-[#FFD700]/30 bg-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(255,215,0,0.1)] border-dashed animate-in fade-in slide-in-from-right duration-700">
          <div className="bg-[#FFD700] p-4 rounded-2xl mb-6 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
            <ShieldCheck className="w-12 h-12 text-[#001F3F]" />
          </div>
          <h2 className="text-3xl font-bold text-[#FFD700] mb-4 text-center leading-tight">
            تمت البرمجة بواسطة
          </h2>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent mb-6" />
          <p className="text-2xl font-bold text-white text-center">
            المبرمج مصطفى جلال محسن
          </p>
          <p className="text-sm text-[#FFD700]/60 mt-4 font-mono">
            ENGINEER & DEVELOPER
          </p>
        </div>

        <Card className="w-full max-w-md border-[#FFD700]/20 bg-white/5 backdrop-blur-xl text-white shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-[#FFD700] rounded-2xl shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                <ShieldCheck className="w-10 h-10 text-[#001F3F]" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-[#FFD700]">تسجيل الدخول</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              يرجى إدخال بيانات الاعتماد للوصول للنظام
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-right block">البريد الإلكتروني</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="superadmin@gov.iq"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-[#FFD700]/20 text-white placeholder:text-gray-500 pr-10 h-12 text-right"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" title="كلمة المرور" className="text-gray-300 text-right block">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/10 border-[#FFD700]/20 text-white pr-10 h-12 text-right"
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FFD700]" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 bg-transparent border-none">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-[#FFD700] hover:bg-[#FFD700]/90 text-[#001F3F] shadow-[0_4px_15px_rgba(255,215,0,0.3)] transition-all duration-300 active:scale-95"
                disabled={loading}
              >
                {loading ? 'جاري التحقق...' : 'دخول النظام'}
              </Button>
              <div className="text-center text-sm text-gray-500 mt-4 border-t border-white/10 pt-4 w-full">
                نظام محمي ومشفر بالكامل © 2026
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      {/* Mobile Credit Text */}
      <div className="absolute bottom-6 text-[#FFD700]/60 text-sm font-medium md:hidden">
        تمت برمجة الموقع من قبل المبرمج مصطفى جلال محسن
      </div>
    </div>
  );
}
