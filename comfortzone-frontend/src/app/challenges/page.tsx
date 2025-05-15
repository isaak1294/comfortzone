'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';

type CompletionMap = Record<
  string,
  { completed: boolean; completedAt: string }
>;

const getDaysInMonth = (year: number, month: number) => {
  const days = [];
  const date = dayjs(`${year}-${month + 1}-01`);
  const daysInMonth = date.daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(new Date(year, month, i)));
  }
  return days;
};

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
      {/* Today's Challenge Display */}
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

      {/* Calendar */}
      <div className="p-4 bg-white/80 rounded-xl shadow backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          {today.format('MMMM YYYY')}
        </h1>

        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth(year, month).map((date) => {
            const dateKey = date.format('YYYY-MM-DD');
            const record = completedDays[dateKey];
            const isComplete = record?.completed;
            const completedAt = record?.completedAt
              ? dayjs(record.completedAt)
              : null;

            const isRetro = isComplete && completedAt && completedAt.isAfter(date, 'day');

            return (
              <button
                key={dateKey}
                onClick={() => handleDayClick(date)}
                className={`aspect-square w-full rounded-md text-sm font-medium transition-all ${
                  isComplete
                    ? isRetro
                      ? 'bg-yellow-400 text-white'
                      : 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
                }`}
              >
                {date.date()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
