import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { localDb, supabase } from '../services/db';
import { initializeFromSupabase, storageClear } from '../services/supabaseSync';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessPath: (path: string) => boolean;
  clearError: () => void;
}

const SESSION_KEY = 'jt_crm_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (supabase) {
          await initializeFromSupabase();
        }

        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const { userId } = JSON.parse(savedSession);
          const profile = localDb.getUserById(userId);
          if (profile && profile.is_active) {
            setUser(profile);
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (supabase) {
        await initializeFromSupabase();
      }

      const localUser = localDb.getUserByEmail(email);
      if (!localUser) {
        setError('Invalid credentials. No user found with this email address.');
        return false;
      }

      if (!localUser.is_active) {
        setError('Your account is currently inactive. Please contact an Administrator.');
        return false;
      }

      setUser(localUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: localUser.id }));
      return true;
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      localStorage.removeItem(SESSION_KEY);
      storageClear();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const canAccessPath = (path: string): boolean => {
    if (!user) return false;
    
    // Normalize path
    const normalized = path.toLowerCase();
    
    if (normalized === '/dashboard' || normalized === '/') return true;
    
    if (user.role === 'admin') {
      return true; // Admin has full access to all routes
    }
    
    if (user.role === 'sales_agent') {
      const allowed = ['/dashboard', '/customers', '/orders', '/notifications', '/shift-handover'];
      return allowed.some(p => normalized.startsWith(p));
    }

    if (user.role === 'support_agent') {
      const allowed = ['/dashboard', '/customers', '/queries', '/orders', '/notifications', '/shift-handover'];
      return allowed.some(p => normalized.startsWith(p));
    }

    return false;
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        hasRole,
        canAccessPath,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
