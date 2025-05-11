'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface User {
  email: string;
  username: string;
  profilePicture: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    username?: string,
    profilePicture?: string
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
        fetch('http://localhost:4000/api/me', {
        headers: { Authorization: `Bearer ${stored}` },
        })
        .then((res) => res.json())
        .then((data) =>
            setUser({
            email: data.email,
            username: data.username,
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


    const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        email: data.email,
        username: data.username,
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
    password: string,
    username?: string,
    profilePicture?: string
    ): Promise<boolean> => {
    try {
        const res = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, profilePicture }),
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
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: !!token,
        token,
        user,
        login,
        register,
        logout
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
