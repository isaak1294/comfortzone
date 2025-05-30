'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

const tabs = [
  { name: 'Home', href: '/' },
  { name: 'Challenges', href: '/challenges' },
  { name: 'Account', href: '/account' },
  { name: 'Social', href: '/social' },
  { name: 'Messages', href: '/social/message-center' }, // Added
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(`${API_BASE}/api/groups/my-invites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((invites) => {
          const unread = invites.filter((invite: any) => !invite.read).length;
          setUnreadCount(unread);
        })
        .catch((err) => console.error('Error fetching invites:', err));
    }
  }, [isAuthenticated, token]);

  return (
    <nav className="w-full bg-zinc-200 shadow-md backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-800">Get Out There</h1>
        <ul className="flex space-x-6">
          {tabs.map((tab) => (
            <li key={tab.name} className="relative">
              <Link
                href={tab.href}
                className={`text-gray-700 hover:text-blue-600 font-medium ${
                  pathname === tab.href ? 'underline text-blue-700' : ''
                }`}
              >
                {tab.name}
                {tab.name === 'Messages' && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
          <li>
            {isAuthenticated ? (
              <button onClick={logout} className="text-sm text-red-500 underline">
                Log out
              </button>
            ) : (
              <a href="/login" className="text-sm text-blue-600 underline">
                Sign in
              </a>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}