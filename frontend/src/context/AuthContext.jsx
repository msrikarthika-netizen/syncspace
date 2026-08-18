import { createContext, useContext, useState, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_user')); }
    catch { return null; }
  });

  const login = useCallback((token, userData) => {
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      // Clear the local application session even if Firebase is temporarily unreachable.
      console.error('Firebase sign-out failed:', error);
    }
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, ...updates };
      localStorage.setItem('ss_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const isAuthenticated = Boolean(user);
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated, isManager, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
