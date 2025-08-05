import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface SidebarProps {
    username: string;
    lastMessage: string;
    lastMessageTime: string;
}

interface Friend {
  id: string;
  username: string;
  profilePicture: string | null;
}

export default function FriendSidebar() {
    const { isAuthenticated, token, user } = useAuth();
    const router = useRouter();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const pathname = usePathname();
    const basePath = "/social/message-center/"

    fetchFriends();

    return(
        <div className="h-screen w-64 bg-gray-900 text-white flex flex-col p-4 shadow-lg">
            <div className="text-2xl font-bold mb-8">Messages</div>
            <nav className="flex flex-col space-y-4">
                {friends.map((person) =>
                    <Link key={person.id} href={basePath + person.username}>
                        <span className={`cursor-pointer px-4 py-2 rounded hover:bg-gray-700 transition
                        ${pathname === basePath + person.username ? 'bg-gray-700' : ''}`}>
                        {person.username}
                        </span>
                    </Link>
                )}
            </nav>
        </div>
    );

}