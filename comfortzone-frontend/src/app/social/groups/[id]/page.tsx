'use client';

import { useEffect, useState, FormEvent, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface User {
  id: string;
  email: string;
  username: string;
  profilePicture: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  date: string;
  completions: {
    id: string;
    userId: string;
    completed: boolean;
    completedAt: string;
    user: User;
  }[];
}

interface GroupMember {
  id: string;
  userId: string;
  joinedAt: string;
  user: User;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: GroupMember[];
  challenges: Challenge[];
  messages: Message[];
}

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
  });
  const [showNewChallengeForm, setShowNewChallengeForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false); // Added
  const { user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchGroupData();
  }, [isAuthenticated, id]);

  const fetchGroupData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/groups/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch group data');
      }

      const data = await response.json();
      setGroup(data);
    } catch (err) {
      setError('Error loading group data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !token) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: message }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setGroup((prev) => 
          prev ? { ...prev, messages: [...prev.messages, newMessage] } : null
        );
        setMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const createChallenge = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChallenge.title || !newChallenge.description || !token) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/${id}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newChallenge.title,
          description: newChallenge.description,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const challenge = await response.json();
        setGroup((prev) => 
          prev ? { ...prev, challenges: [challenge, ...prev.challenges] } : null
        );
        setNewChallenge({ title: '', description: '' });
        setShowNewChallengeForm(false);
      }
    } catch (err) {
      console.error('Error creating challenge:', err);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/groups/${id}/challenges/${challengeId}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchGroupData(); // Refresh data to show updated completion status
      }
    } catch (err) {
      console.error('Error completing challenge:', err);
    }
  };

  const sendInvite = async (e: FormEvent) => { // Added
    e.preventDefault();
    if (!inviteEmail.trim() || !token) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/${id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (response.ok) {
        setInviteEmail('');
        setShowInviteForm(false);
        alert('Invite sent successfully!');
      } else {
        const errorData = await response.json();
        alert(`Failed to send invite: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Error sending invite:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading group data...</div>;
  }

  if (error || !group) {
    return <div className="text-center py-10 text-red-500">{error || 'Group not found'}</div>;
  }

  // Get the current/latest challenge
  const currentChallenge = group.challenges.length > 0 ? group.challenges[0] : null;
  
  // Check if the current user has completed the challenge
  const hasCompletedChallenge = currentChallenge?.completions?.some(
    (completion) => completion.userId === user?.id
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
        {group.description && <p className="text-gray-600 mb-4">{group.description}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: Members */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Members ({group.members.length})</h2>
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {showInviteForm ? 'Cancel' : 'Invite'}
              </button>
            </div>
            {showInviteForm && (
              <form onSubmit={sendInvite} className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Send Invite
                </button>
              </form>
            )}
            <h2 className="text-xl font-semibold mb-4">Members ({group.members.length})</h2>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                    {member.user.profilePicture ? (
                      <Image 
                        src={member.user.profilePicture} 
                        alt={member.user.username || member.user.id}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        👤
                      </div>
                    )}
                  </div>
                  <span>
                    {member.user.username && member.user.username !== 'Anonymous'
                      ? member.user.username
                      : member.user.email}
                  </span>{/* Fallback to email */}
                </div>
              ))}
            </div>
          </div>
          
          {/* Middle column: Current Challenge */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Today's Challenge</h2>
              <button 
                onClick={() => setShowNewChallengeForm(!showNewChallengeForm)}
                className="text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {showNewChallengeForm ? 'Cancel' : 'New Challenge'}
              </button>
            </div>
            
            {showNewChallengeForm ? (
              <form onSubmit={createChallenge} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Create Challenge
                </button>
              </form>
            ) : currentChallenge ? (
              <div>
                <h3 className="font-bold text-lg">{currentChallenge.title}</h3>
                <p className="text-gray-700 my-2">{currentChallenge.description}</p>
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Completion Status:</h4>
                  <div className="space-y-2">
                    {group.members.map((member) => {
                      const hasCompleted = currentChallenge?.completions?.some(
                        (completion) => completion.userId === member.user.id
                      );
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between">
                          <span>
                            {member.user.username && member.user.username !== 'Anonymous'
                              ? member.user.username
                              : member.user.email}
                          </span>
                          {hasCompleted ? (
                            <span className="text-green-500">✓ Completed</span>
                          ) : (
                            <span className="text-red-500">Not completed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!hasCompletedChallenge && (
                    <button
                      onClick={() => completeChallenge(currentChallenge.id)}
                      className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No challenge set for today.</p>
                <p>Create a new challenge to get started!</p>
              </div>
            )}
          </div>
          
          {/* Right column: Group Chat */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col h-[500px]">
            <h2 className="text-xl font-semibold mb-4">Group Chat</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {group.messages.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
              ) : (
                group.messages.map((msg) => (
                  <div key={msg.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                        {msg.user.profilePicture ? (
                          <Image 
                            src={msg.user.profilePicture} 
                            alt={msg.user.username}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            👤
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        {msg.user.username && msg.user.username !== 'Anonymous'
                          ? msg.user.username
                          : msg.user.email}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-800">{msg.content}</p>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}