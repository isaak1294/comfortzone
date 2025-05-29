'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface User {
  id: string;
  email: string;
  username: string;
  bio: string;
  profilePicture: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<string | null>; // changed from boolean
  register: (
    email: string,
    username: string,
    password: string,
    profilePicture?: string | null
  ) => Promise<boolean>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<boolean>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    if (stored) {
      setToken(stored);
      fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          
          setUser({
            id: data.id,
            email: data.email,
            username: data.username || data.email,
            bio: data.bio,
            profilePicture: data.profilePicture,
            emailVerified: data.emailVerified || false,
          });
          
          // If email is not verified, log them out
          if (!data.emailVerified) {
            logout();
          }
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('authToken');
        });
    }
  }, []);

    const login = async (emailOrUsername: string, password: string): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrUsername, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          return data.error || 'Login failed';
        }

        // Set session state
        localStorage.setItem('authToken', data.token);
        setToken(data.token);
        setUser({
          id: data.id,
          email: data.email,
          username: data.username || data.email,
          bio: data.bio,
          profilePicture: data.profilePicture,
          emailVerified: data.emailVerified,
        });

        return null; // No error
      } catch (err) {
        console.error('Unexpected login error:', err);
        return 'Unexpected login error';
      }
    };


  const register = async (
    email: string,
    username: string,
    password: string,
    profilePicture?: string | null
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, profilePicture }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        console.error('Registration error:', data.error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  };
  
  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      return res.ok;
    } catch (err) {
      console.error('Email verification failed', err);
      return false;
    }
  };
  
  const resendVerification = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      return res.ok;
    } catch (err) {
      console.error('Resend verification failed', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setUser({
        id: data.id,
        email: data.email,
        username: data.username || data.email,
        profilePicture: data.profilePicture,
        emailVerified: data.emailVerified,
        bio: data.bio || '',
      });
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user?.emailVerified,
        token,
        user,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
