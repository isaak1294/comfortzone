'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const { login, register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const success = await login(emailOrUsername, password);
    if (success) router.push('/account');
  };

  const handleRegister = async () => {
    if (!email || !username) {
      alert('Email and username are required');
      return;
    }
    const success = await register(email, password, username);
    if (success) {
      alert('Account created. You can now log in.');
      setIsRegistering(false);
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">
        {isRegistering ? 'Create Account' : 'Sign In'}
      </h1>

      {isRegistering ? (
        <>
          <input
            className="w-full mb-2 p-2 border border-gray-300 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full mb-2 p-2 border border-gray-300 rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </>
      ) : (
        <input
          className="w-full mb-2 p-2 border border-gray-300 rounded"
          type="text"
          placeholder="Email or Username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />
      )}

      <input
        className="w-full mb-4 p-2 border border-gray-300 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="flex justify-between">
        {isRegistering ? (
          <>
            <button onClick={handleRegister} className="bg-blue-600 text-white px-4 py-2 rounded">
              Register
            </button>
            <button
              onClick={() => setIsRegistering(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
              Login
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}
