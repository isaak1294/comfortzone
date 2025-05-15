'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface User {
  id: string;
  email: string;
  username: string;
  profilePicture: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    username: string,
    password: string,
    profilePicture?: string | null
  ) => Promise<boolean>;
  logout: () => void;
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
        .then((data) =>
          setUser({
            id: data.id,
            email: data.email,
            username: data.username || data.email,
            profilePicture: data.profilePicture,
          })
        )
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem('authToken');
        });
    }
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Login failed:', err);
        return false;
      }

      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
      setUser({
        id: data.id,
        email: data.email,
        username: data.username || data.email,
        profilePicture: data.profilePicture,
      });
      return true;
    } catch (err) {
      console.error('Unexpected login error:', err);
      return false;
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
      return res.ok;
    } catch (err) {
      console.error('Registration failed', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        login,
        register,
        logout,
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
