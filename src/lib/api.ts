export const api = {
  async post(url: string, body: any) {
    // 1. HARDCODED LOGIN BYPASS (يتجاوز السيرفر تماماً)
    if (url.includes('/api/auth/login')) {
      const email = body.email?.toLowerCase().trim();
      const password = body.password;
      
      if (email === 'superadmin@gov.iq' && password === 'Admin@2026') {
        return {
          user: {
            uid: 'admin-uid',
            email: 'superadmin@gov.iq',
            displayName: 'المدير العام',
            role: 'super_admin'
          }
        };
      }
    }
    
    // 2. طلب طبيعي للسيرفر
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e) {
      console.error("Fetch error");
      throw e;
    }
  },
  
  async get(url: string) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      return []; 
    }
  }
};