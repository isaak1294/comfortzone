// comfortzone-frontend/src/app/friends/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Friend {
  id: string;
  username: string;
  profilePicture: string | null;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/friends`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }

        const data = await response.json();
        setFriends(data);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError('Failed to load friends. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isAuthenticated, token, API_BASE]);

  if (!isAuthenticated) {
    return (
      <div className="text-center text-gray-700 mt-20 space-y-4">
        <p className="text-lg">Please sign in to view your friends.</p>
        <Link href="/login">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Sign in
          </button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center mt-20">Loading friends...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-20">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">My Friends</h1>

      {friends.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          <p>You don't have any friends yet.</p>
          <p className="mt-2">Start by adding friends or accepting friend requests!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <Link href={`/user/${friend.username}`} key={friend.id}>
              <div className="bg-white/80 p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {friend.profilePicture ? (
                      <img
                        src={friend.profilePicture}
                        alt={friend.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No pic
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{friend.username}</h3>
                    <p className="text-blue-500 text-sm">View profile</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/account">
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
            Back to Account
          </button>
        </Link>
      </div>
    </div>
  );
}