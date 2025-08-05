'use client';

import { useEffect, useState } from 'react';

interface Props {
  challenge: { title: string; description: string };
  completed: boolean;
  onToggleComplete: () => void;
  showLoginPrompt?: boolean;
}

export default function DailyChallengeCard({
  challenge,
  completed,
  onToggleComplete,
  showLoginPrompt,
}: Props) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}h ${minutes
          .toString()
          .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  if (completed) return null;

  return (
    <div className="rounded-xl shadow-lg bg-stone-100 max-w-md w-full overflow-hidden transition-all">
      {/* Header section */}
      <div className="bg-indigo-950 px-6 py-4">
        <h2 className="text-2xl font-bold text-center text-gray-200">{challenge.title}</h2>
      </div>

      {/* Body section */}
      <div className="p-6 bg-slate-600 text-center">
        <p className="text-gray-200 mb-4">{challenge.description}</p>
        <p className="text-sm text-gray-600 mb-4">
          Time remaining: <span className="font-mono">{timeLeft}</span>
        </p>

        {showLoginPrompt ? (
          <p className="text-red-600 font-medium">Sign in to save your progress</p>
        ) : (
          <button
            onClick={onToggleComplete}
            className="px-4 py-2 bg-green-400 hover:bg-blue-600 text-gray-600 rounded-md transition-all"
          >
            Mark as Done
          </button>
        )}
      </div>
    </div>
  );
}
