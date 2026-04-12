import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { api } from '../lib/api';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('نظام المراسلات الحكومي');

  useEffect(() => {
    // Mock settings fetch or use a real API
    const fetchSettings = async () => {
      try {
        // For now, just use default or fetch from API if implemented
        // const settings = await api.get('/api/settings');
        // setSiteName(settings.siteName);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'لوحة التحكم', icon: LayoutDashboard, path: '/', roles: ['super_admin', 'dept_manager', 'sect_manager', 'employee'], color: 'text-blue-400' },
    { name: 'المحادثات', icon: MessageSquare, path: '/chat', roles: ['super_admin', 'dept_manager', 'sect_manager', 'employee'], color: 'text-emerald-400' },
    { name: 'المراسلات الرسمية', icon: FileText, path: '/documents', roles: ['super_admin', 'dept_manager', 'sect_manager', 'employee'], color: 'text-amber-400' },
    { name: 'إدارة النظام', icon: Users, path: '/admin', roles: ['super_admin', 'dept_manager', 'sect_manager'], color: 'text-purple-400' },
    { name: 'الإعدادات', icon: Settings, path: '/settings', roles: ['super_admin', 'dept_manager'], color: 'text-slate-400' },
  ];

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen bg-[#001F3F] font-sans text-slate-100" dir="rtl">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#001F3F] border-l border-white/10 shadow-2xl">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-yellow-600 p-2 rounded-lg shadow-lg">
            <ShieldCheck className="text-[#001F3F] w-6 h-6" />
          </div>
          <h1 className="font-bold text-lg gold-text truncate">{siteName}</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                location.pathname === item.path
                  ? 'bg-white/10 text-amber-400 shadow-inner border border-white/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-amber-400' : item.color}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <Separator className="mb-4 bg-white/10" />
          <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-white/5 rounded-2xl border border-white/5">
            <Avatar className="h-10 w-10 border-2 border-amber-400/30">
              <AvatarFallback className="bg-amber-400 text-[#001F3F] font-bold">
                {profile?.displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{profile?.displayName}</span>
              <span className="text-[10px] text-amber-400/70 truncate uppercase tracking-wider">
                {profile?.role === 'super_admin' ? 'المدير العام' : 
                 profile?.role === 'dept_manager' ? 'مدير قسم' :
                 profile?.role === 'sect_manager' ? 'مدير شعبة' : 'موظف'}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold">تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <Button variant="outline" size="icon" className="bg-[#001F3F] border-white/10 text-amber-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 bg-gradient-to-br from-[#001F3F] to-[#003366] relative">
        <div className="max-w-7xl mx-auto pb-12">
          {children}
        </div>
        
        <div className="programmer-credit">
          تمت برمجة الموقع من قبل المبرمج مصطفى جلال محسن
        </div>
      </main>
    </div>
  );
};
