import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { login, signup } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  avatar_url?: string;
  assigned_channels: string[];
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  session: { issuedAt: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'employee') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<{ issuedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const storageKey = 'smartScheduleUser';

  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached) as UserProfile;
      setUser(parsed);
      setProfile(parsed);
      setSession({ issuedAt: new Date().toISOString() });
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await login(email, password);
      const profileData = result.user as UserProfile;
      setUser(profileData);
      setProfile(profileData);
      setSession({ issuedAt: new Date().toISOString() });
      localStorage.setItem(storageKey, JSON.stringify(profileData));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'employee' = 'employee'
  ) => {
    try {
      const result = await signup(email, password, fullName, role);
      const profileData = result.user as UserProfile;
      setUser(profileData);
      setProfile(profileData);
      setSession({ issuedAt: new Date().toISOString() });
      localStorage.setItem(storageKey, JSON.stringify(profileData));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(storageKey);
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isEmployee = profile?.role === 'employee';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      isAdmin,
      isEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
