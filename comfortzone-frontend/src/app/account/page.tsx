'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AccountPage() {
  const [about, setAbout] = useState('Tell us about yourself...');
  const [editing, setEditing] = useState(false);
  const [streak, setStreak] = useState(5); // placeholder
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  let isAuthenticated = false;
  let user = null;

  // Avoid SSR crash if context isn't ready
  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    user = auth.user;
  } catch (err) {
    console.error('Auth context error:', err);
  }

  useEffect(() => {
    console.log('Account page mounted');
    setIsReady(true);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (!isReady) {
    return <div className="text-white text-center mt-20">Loading account...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center text-gray-700 mt-20 space-y-4">
        <p className="text-lg">Create an account or sign in to view your profile.</p>
        <Link href="/login">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Sign in
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white/80 p-6 rounded-xl shadow-lg backdrop-blur-sm">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">My Account</h1>

      <div className="flex flex-col items-center gap-4 mb-6">
        <label htmlFor="photo-upload" className="cursor-pointer">
          <div className="w-32 h-32 rounded-full border-4 border-gray-300 overflow-hidden bg-gray-100">
            {typeof profilePhoto === 'string' && profilePhoto.startsWith('data:image') ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Upload
              </div>
            )}
          </div>
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">About Me</h2>
        {editing ? (
          <>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={() => setEditing(false)}
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-md"
            >
              Save
            </button>
          </>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="cursor-pointer bg-gray-100 p-3 rounded-md text-gray-700"
          >
            {about}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Current Streak</h2>
        <p className="text-3xl font-bold text-green-600">{streak}🔥</p>
      </div>
    </div>
  );
}
