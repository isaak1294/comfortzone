// comfortzone-frontend/src/app/user/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  profilePicture: string | null;
  streak: number;
  bio: string;
}

interface Friend {
  id: string;
  username: string;
  profilePicture: string | null;
}

export default function UserProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch(`${API_BASE}/api/user/${username}`);
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const profileData = await profileResponse.json();
        setProfile(profileData);
        
        // Fetch user's friends
        const friendsResponse = await fetch(`${API_BASE}/api/user/${username}/friends`);
        
        if (!friendsResponse.ok) {
          throw new Error('Failed to fetch user friends');
        }
        
        const friendsData = await friendsResponse.json();
        setFriends(friendsData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username, API_BASE]);

  if (loading) {
    return <div className="text-center mt-20">Loading profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="text-center text-red-500 mt-20">
        {error || 'User not found'}
        <div className="mt-4">
          <Link href="/account">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
              Back to Account
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 p-6">
      <div className="bg-white/80 p-6 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Profile Picture */}
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No pic
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.username}</h1>
            
            <div className="mb-4">
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                Streak: {profile.streak}🔥
              </span>
            </div>
            
            <div className="text-gray-600 mb-6">
              <p>{profile.bio}</p>
            </div>
          </div>
        </div>
        
        {/* Friends Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Friends ({friends.length})</h2>
          
          {friends.length === 0 ? (
            <p className="text-gray-500">This user doesn't have any friends yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {friends.slice(0, 8).map((friend) => (
                <Link href={`/user/${friend.username}`} key={friend.id}>
                  <div className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition text-center">
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gray-200 mb-2">
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
                    <p className="text-sm font-medium truncate">{friend.username}</p>
                  </div>
                </Link>
              ))}
              
              {friends.length > 8 && (
                <Link href={`/user/${profile.username}/friends`}>
                  <div className="bg-gray-50 p-3 rounded-lg hover:shadow-md transition text-center flex items-center justify-center h-full">
                    <p className="text-blue-500">View all friends</p>
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
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