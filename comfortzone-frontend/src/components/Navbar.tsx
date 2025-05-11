'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const tabs = [
  { name: 'Home', href: '/'},
  { name: 'Challenges', href: '/challenges' },
  { name: 'Account', href: '/account' },
  { name: 'Social', href: '/social' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <nav className="w-full bg-stone-600 shadow-md backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-800">Get Out There</h1>
        <ul className="flex space-x-6">
          {tabs.map((tab) => (
            <li key={tab.name}>
              <Link
                href={tab.href}
                className={`text-gray-700 hover:text-blue-600 font-medium ${
                  pathname === tab.href ? 'underline text-blue-700' : ''
                }`}
              >
                {tab.name}
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
