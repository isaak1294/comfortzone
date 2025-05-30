'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import Calendar from '@/components/Calendar';

type CompletionMap = Record<string, { completed: boolean; completedAt: string }>;

export default function ChallengesPage() {
  const router = useRouter();
  const today = dayjs();
  const year = today.year();
  const month = today.month();
  const dateStr = today.format('YYYY-MM-DD');

  const { isAuthenticated, token } = useAuth();

  const [completedDays, setCompletedDays] = useState<CompletionMap>({});
  const [challenge, setChallenge] = useState<{ title: string; description: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) return;

      try {
        const [challengeRes, completionsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/challenge/${dateStr}`),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/completions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (challengeRes.ok) {
          const challengeData = await challengeRes.json();
          setChallenge(challengeData);
        }

        if (completionsRes.ok) {
          const completionData: CompletionMap = await completionsRes.json();
          setCompletedDays(completionData);
          setIsCompleted(completionData[dateStr]?.completed || false);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    if (isAuthenticated) {
      fetchAll();
    }
  }, [isAuthenticated, token]);

  const handleDayClick = (date: dayjs.Dayjs) => {
    const target = date.format('YYYY-MM-DD');
    router.push(`/challenges/${target}`);
  };

  const toggleCompleted = async () => {
    if (!token) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date: dateStr, completed: !isCompleted }),
    });

    if (res.ok) {
      setIsCompleted(!isCompleted);
      setCompletedDays((prev) => ({
        ...prev,
        [dateStr]: {
          completed: !isCompleted,
          completedAt: new Date().toISOString(),
        },
      }));
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      {challenge && (
        <div className="bg-white/80 p-4 rounded-xl shadow backdrop-blur-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{challenge.title}</h2>
          <p className="text-gray-700 mb-4">{challenge.description}</p>
          {isAuthenticated && (
            <button
              onClick={toggleCompleted}
              className={`px-4 py-2 rounded text-white ${
                isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}
            </button>
          )}
        </div>
      )}
      <Calendar year={year} month={month} completedDays={completedDays} onDayClick={handleDayClick} />
    </div>
  );
}
