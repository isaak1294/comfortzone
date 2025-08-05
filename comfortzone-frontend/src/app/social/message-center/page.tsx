'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FriendSidebar from '@/components/FriendSidebar';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface Invite {
  id: string;
  sender: { username?: string; email: string };
  group?: { name: string };
  message: string;
  createdAt: string;
  read: boolean;
  accepted: boolean | null;
  type: 'group_invite' | 'friend_request';
}

interface Friend {
  id: string;
  username: string;
  profilePicture: string | null;
}

interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  read: boolean;
}

export default function MessageCenter() {
  const { isAuthenticated, token, user } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInvites();
    fetchFriends();
  }, [isAuthenticated]);

  const fetchInvites = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/groups/my-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch invites');
      const data = await response.json();
      // Only show pending invites
      setInvites(data.filter((invite: Invite) => invite.accepted === null));
    } catch (err) {
      console.error('Error fetching invites:', err);
    }
  };

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

  const fetchMessages = async (friendId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/dm/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const respondToInvite = async (inviteId: string, accepted: boolean) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/groups/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accepted }),
      });
      if (response.ok) {
        // Refresh invites and friends after responding
        fetchInvites();
        fetchFriends();
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
    }
  };

  const sendMessage = async () => {
    if (!token || !selectedFriend || !newMessage.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId: selectedFriend, content: newMessage }),
      });
      
      if (response.ok) {
        setNewMessage('');
        // Refresh messages and friends (to update sort order)
        fetchMessages(selectedFriend);
        fetchFriends();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriend(friendId);
    fetchMessages(friendId);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <>
      <FriendSidebar/>
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      {/* Friend Requests Section */}
      <h2 className="text-2xl font-semibold mb-4">Friend Requests</h2>
      {invites.length === 0 ? (
        <p className="text-gray-500 mb-6">No pending requests.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className={`p-4 rounded-lg shadow-md ${
                invite.read ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <p className="font-medium">
                {invite.type === 'friend_request' ? (
                  <>
                    {invite.sender.username || invite.sender.email} sent you a friend request
                  </>
                ) : (
                  <>
                    {invite.sender.username || invite.sender.email} invited you to join{' '}
                    <span className="font-bold">{invite.group?.name || 'a group'}</span>
                  </>
                )}
              </p>
              <p className="text-gray-600">{invite.message}</p>
              <p className="text-xs text-gray-500">
                {new Date(invite.createdAt).toLocaleString()}
              </p>
              {invite.accepted === null ? (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => respondToInvite(invite.id, true)}
                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToInvite(invite.id, false)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm">
                  {invite.accepted ? 'Accepted' : 'Declined'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Direct Messages Section */}
      <h2 className="text-2xl font-semibold mb-4">Direct Messages</h2>
      <div className="flex">
        {/* Friends list */}
        <div className="w-1/3 pr-4">
          {friends.length === 0 ? (
            <p className="text-gray-500">No friends yet. Add some friends to start chatting!</p>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleFriendSelect(friend.id)}
                  className={`w-full p-3 text-left rounded-md flex items-center ${
                    selectedFriend === friend.id
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white hover:bg-gray-100'
                  } border`}
                >
                  {friend.profilePicture ? (
                    <img
                      src={friend.profilePicture}
                      alt={friend.username}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3 flex items-center justify-center">
                      {friend.username[0]}
                    </div>
                  )}
                  <span>{friend.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Chat window */}
        <div className="w-2/3 pl-4">
          {selectedFriend ? (
            <div className="border rounded-md h-[400px] flex flex-col">
              {/* Chat header */}
              <div className="p-3 border-b bg-gray-50">
                <h3 className="font-semibold">
                  {friends.find(f => f.id === selectedFriend)?.username}
                </h3>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-3 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${
                      message.sender.id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender.id === user?.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message input */}
              <div className="p-3 border-t">
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md h-[400px] flex items-center justify-center text-gray-500">
              Select a friend to start chatting
            </div>
          )}
        </div>
      </div>
    </>
  );
}