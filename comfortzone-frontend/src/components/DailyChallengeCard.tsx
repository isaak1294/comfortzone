'use client';

import { useEffect, useState } from 'react';

interface Props {
  challenge: string;
}

export default function DailyChallengeCard({ challenge }: Props) {
  const [completed, setCompleted] = useState(false);
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

      setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes
        .toString()
        .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
    };

    updateCountdown(); // initial run
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer); // cleanup
  }, []);

  return (
    <div
      className={`p-6 rounded-xl shadow-lg bg-stone-400 backdrop-blur-md max-w-md w-full text-center transition-all ${
        completed ? 'opacity-60 line-through' : ''
      }`}
    >
      <p className="text-xl font-semibold text-gray-800 mb-2">{challenge}</p>

      <p className="text-sm text-gray-700 mb-4">
        Time remaining: <span className="font-mono">{timeLeft}</span>
      </p>

      <button
        onClick={() => setCompleted(!completed)}
        className={`px-4 py-2 rounded-md text-white transition-all ${
          completed ? 'bg-green-400' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {completed ? 'Completed!' : 'Mark as Done'}
      </button>
    </div>
  );
}
