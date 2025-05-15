'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface Invite {
  id: string;
  sender: { username?: string; email: string };
  group: { name: string };
  message: string;
  createdAt: string;
  read: boolean;
  accepted: boolean | null;
}

export default function MessageCenter() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchInvites();
  }, [isAuthenticated]);

  const fetchInvites = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/groups/my-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch invites');
      const data = await response.json();
      setInvites(data);
    } catch (err) {
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
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
        setInvites((prev) =>
          prev.map((invite) =>
            invite.id === inviteId ? { ...invite, accepted, read: true } : invite
          )
        );
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Message Center</h1>
      {invites.length === 0 ? (
        <p className="text-gray-500">No invites yet.</p>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className={`p-4 rounded-lg shadow-md ${
                invite.read ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              <p className="font-medium">
                {invite.sender.username || invite.sender.email} invited you to join{' '}
                <span className="font-bold">{invite.group.name}</span>
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
    </div>
  );
}