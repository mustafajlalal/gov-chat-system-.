import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthReady: false,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('gov_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setProfile(u);
    }
    setLoading(false);
    setIsAuthReady(true);
  }, []);

  const login = (userData: any) => {
    setUser(userData);
    setProfile(userData);
    localStorage.setItem('gov_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('gov_user');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
