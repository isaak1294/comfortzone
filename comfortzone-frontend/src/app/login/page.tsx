'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) router.push('/account');
  };

  const handleRegister = async () => {
    const success = await register(email, password);
    if (success) alert('Account created. You can now log in.');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white/80 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>

      <input
        className="w-full mb-2 p-2 border border-gray-300 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full mb-4 p-2 border border-gray-300 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex justify-between">
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
          Login
        </button>
        <button onClick={handleRegister} className="bg-gray-600 text-white px-4 py-2 rounded">
          Register
        </button>
      </div>
    </div>
  );
}
