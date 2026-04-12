import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Trash2, UserPlus, Building2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, Department, Section, UserRole } from '../types';
import { api } from '../lib/api';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';

export default function Admin() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newSectName, setNewSectName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  
  // Add User states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('employee');
  const [newUserDeptId, setNewUserDeptId] = useState('');
  const [newUserSectId, setNewUserSectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchData = async () => {
    try {
      const [u, d, s] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/departments'),
        api.get('/api/sections')
      ]);
      setUsers(u);
      setDepartments(d);
      setSections(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      await api.post('/api/departments', { name: newDeptName });
      setNewDeptName('');
      toast.success('تم إنشاء القسم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('خطأ في إنشاء القسم');
    }
  };

  const handleCreateSect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectName || !selectedDeptId) return;
    try {
      await api.post('/api/sections', { name: newSectName, departmentId: selectedDeptId });
      setNewSectName('');
      toast.success('تم إنشاء الشعبة بنجاح');
      fetchData();
    } catch (error) {
      toast.error('خطأ في إنشاء الشعبة');
    }
  };

  const handleUpdateUserRole = async (uid: string, role: UserRole, deptId?: string, sectId?: string) => {
    try {
      await api.patch(`/api/users/${uid}`, { role, departmentId: deptId, sectionId: sectId });
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      fetchData();
    } catch (error) {
      toast.error('خطأ في تحديث الدور');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await api.delete(`/api/users/${uid}`);
        toast.success('تم حذف المستخدم بنجاح');
        fetchData();
      } catch (error) {
        toast.error('خطأ في الحذف');
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserDisplayName || !newUserRole) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/users', {
        email: newUserEmail,
        password: newUserPassword,
        displayName: newUserDisplayName,
        role: newUserRole,
        departmentId: newUserDeptId,
        sectionId: newUserSectId
      });
      toast.success('تم إضافة المستخدم بنجاح');
      setIsAddUserOpen(false);
      resetUserForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'خطأ في إضافة المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUserForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserDisplayName('');
    setNewUserRole('employee');
    setNewUserDeptId('');
    setNewUserSectId('');
  };

  const getAvailableRoles = () => {
    if (profile?.role === 'super_admin') {
      return [
        { value: 'super_admin', label: 'المدير العام' },
        { value: 'dept_manager', label: 'مدير قسم' },
        { value: 'sect_manager', label: 'مدير شعبة' },
        { value: 'employee', label: 'موظف' }
      ];
    }
    if (profile?.role === 'dept_manager') {
      return [
        { value: 'sect_manager', label: 'مدير شعبة' },
        { value: 'employee', label: 'موظف' }
      ];
    }
    if (profile?.role === 'sect_manager') {
      return [
        { value: 'employee', label: 'موظف' }
      ];
    }
    return [];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-amber-900/40 text-amber-400 border border-amber-400/20">المدير العام</Badge>;
      case 'dept_manager': return <Badge className="bg-blue-900/40 text-blue-400 border border-blue-400/20">مدير قسم</Badge>;
      case 'sect_manager': return <Badge className="bg-emerald-900/40 text-emerald-400 border border-emerald-400/20">مدير شعبة</Badge>;
      default: return <Badge variant="outline" className="border-slate-700 text-slate-400">موظف</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gold-text">إدارة النظام</h1>
          <p className="text-blue-200/70">إدارة المستخدمين والأقسام والصلاحيات</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger
            render={
              <Button className="gold-button rounded-2xl h-14 px-8 shadow-2xl font-bold text-lg">
                <UserPlus className="ml-2 w-6 h-6" />
                إضافة مستخدم جديد
              </Button>
            }
          />
          <DialogContent className="bg-slate-900 border-white/10 text-white rounded-3xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl gold-text">إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="grid md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input 
                    value={newUserDisplayName}
                    onChange={(e) => setNewUserDisplayName(e.target.value)}
                    placeholder="اسم الموظف"
                    className="rounded-xl bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input 
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="email@gov.iq"
                    className="rounded-xl bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input 
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="********"
                    className="rounded-xl bg-white/5 border-white/10 text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>الدور الوظيفي</Label>
                  <Select onValueChange={(val) => setNewUserRole(val as UserRole)} value={newUserRole}>
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القسم</Label>
                  <Select onValueChange={setNewUserDeptId} value={newUserDeptId}>
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الشعبة</Label>
                  <Select onValueChange={setNewUserSectId} value={newUserSectId}>
                    <SelectTrigger className="rounded-xl bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="اختر الشعبة" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {sections.filter(s => s.departmentId === newUserDeptId).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="md:col-span-2">
                <Button type="submit" disabled={isSubmitting} className="w-full gold-button rounded-xl h-12 font-bold text-lg">
                  {isSubmitting ? 'جاري الإضافة...' : 'تأكيد إضافة المستخدم'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-slate-900/50 border border-white/10 p-1 rounded-2xl h-14 backdrop-blur-md">
          <TabsTrigger value="users" className="rounded-xl px-8 data-[state=active]:bg-amber-400 data-[state=active]:text-[#001F3F] font-bold">المستخدمين</TabsTrigger>
          <TabsTrigger value="structure" className="rounded-xl px-8 data-[state=active]:bg-amber-400 data-[state=active]:text-[#001F3F] font-bold">الهيكل التنظيمي</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-xl text-white">قائمة المستخدمين</CardTitle>
              <CardDescription className="text-slate-400">إدارة أدوار الموظفين وتعيينهم للأقسام</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-right text-amber-400/70">الاسم</TableHead>
                    <TableHead className="text-right text-amber-400/70">البريد</TableHead>
                    <TableHead className="text-right text-amber-400/70">الدور</TableHead>
                    <TableHead className="text-right text-amber-400/70">القسم / الشعبة</TableHead>
                    <TableHead className="text-left text-amber-400/70">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.uid} className="border-white/5 hover:bg-white/5">
                      <TableCell className="font-medium text-white">{u.displayName}</TableCell>
                      <TableCell className="text-slate-400">{u.email}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div className="text-blue-400 font-medium">
                            {departments.find(d => d.id === u.departmentId)?.name || '-'}
                          </div>
                          <div className="text-slate-500">
                            {sections.find(s => s.id === u.sectionId)?.name || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            onValueChange={(val) => handleUpdateUserRole(u.uid, val as UserRole, u.departmentId, u.sectionId)}
                            defaultValue={u.role}
                          >
                            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-slate-800/50 border-white/10 text-white">
                              <SelectValue placeholder="تغيير الدور" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              <SelectItem value="super_admin">المدير العام</SelectItem>
                              <SelectItem value="dept_manager">مدير قسم</SelectItem>
                              <SelectItem value="sect_manager">مدير شعبة</SelectItem>
                              <SelectItem value="employee">موظف</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select 
                            onValueChange={(val) => handleUpdateUserRole(u.uid, u.role, val, u.sectionId)}
                            defaultValue={u.departmentId}
                          >
                            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-slate-800/50 border-white/10 text-white">
                              <SelectValue placeholder="تعيين قسم" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              {departments.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            onValueChange={(val) => handleUpdateUserRole(u.uid, u.role, u.departmentId, val)}
                            defaultValue={u.sectionId}
                          >
                            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-slate-800/50 border-white/10 text-white">
                              <SelectValue placeholder="تعيين شعبة" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                              {sections.filter(s => s.departmentId === u.departmentId).map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl"
                            onClick={() => handleDeleteUser(u.uid)}
                            disabled={u.uid === profile?.uid}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Departments Management */}
            <Card className="border-none shadow-2xl rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  الأقسام
                </CardTitle>
                <CardDescription className="text-slate-400">إضافة وإدارة الأقسام الرئيسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.role === 'super_admin' && (
                  <form onSubmit={handleCreateDept} className="flex gap-2">
                    <Input 
                      placeholder="اسم القسم الجديد (مثل: المالية)" 
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="rounded-xl bg-slate-800/50 border-white/10 text-white focus:border-amber-400"
                    />
                    <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6">
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة
                    </Button>
                  </form>
                )}
                <div className="space-y-2">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-400/30 transition-all">
                      <span className="font-bold text-white">{dept.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl"
                        onClick={async () => {
                          if (confirm('حذف القسم سيؤثر على الموظفين المرتبطين به. هل أنت متأكد؟')) {
                            try {
                              await api.delete(`/api/departments/${dept.id}`);
                              toast.success('تم حذف القسم بنجاح');
                              fetchData();
                            } catch (e) {
                              toast.error('خطأ في الحذف');
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sections Management */}
            <Card className="border-none shadow-2xl rounded-3xl bg-slate-900/40 backdrop-blur-md border border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  الشعب
                </CardTitle>
                <CardDescription className="text-slate-400">إضافة شعب تابعة للأقسام</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(profile?.role === 'super_admin' || profile?.role === 'dept_manager') && (
                  <form onSubmit={handleCreateSect} className="space-y-3">
                    <Select onValueChange={setSelectedDeptId} value={selectedDeptId}>
                      <SelectTrigger className="rounded-xl bg-slate-800/50 border-white/10 text-white">
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="اسم الشعبة (مثل: الحسابات)" 
                        value={newSectName}
                        onChange={(e) => setNewSectName(e.target.value)}
                        className="rounded-xl bg-slate-800/50 border-white/10 text-white focus:border-amber-400"
                      />
                      <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6">
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة
                      </Button>
                    </div>
                  </form>
                )}
                <div className="space-y-2">
                  {sections.map(sect => (
                    <div key={sect.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-400/30 transition-all">
                      <div>
                        <span className="font-bold text-white">{sect.name}</span>
                        <span className="text-xs text-slate-500 mr-2">
                          (تابع لـ: {departments.find(d => d.id === sect.departmentId)?.name})
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl"
                        onClick={async () => {
                          if (confirm('هل أنت متأكد من حذف هذه الشعبة؟')) {
                            try {
                              await api.delete(`/api/sections/${sect.id}`);
                              toast.success('تم حذف الشعبة بنجاح');
                              fetchData();
                            } catch (e) {
                              toast.error('خطأ في الحذف');
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
