'use client';
import { useEffect, useState } from 'react';
import DailyChallengeCard from "@/components/DailyChallengeCard";
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useAuth } from '@/context/AuthContext';
import Calendar from '@/components/Calendar';

type CompletionMap = Record<string, { completed: boolean; completedAt: string }>;

export default function Home() {
  const router = useRouter();
  const today = dayjs();
  const year = today.year();
  const month = today.month();
  const dateStr = today.format('YYYY-MM-DD');
  const { isAuthenticated, token } = useAuth();

  const [completedDays, setCompletedDays] = useState<CompletionMap>({});
  const [challenge, setChallenge] = useState<{ title: string; description: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeError, setChallengeError] = useState(false);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalChallenge/${dateStr}`);
        if (res.ok) {
          const challengeData = await res.json();
          setChallenge(challengeData);
        } else {
          setChallengeError(true);
        }
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setChallengeError(true);
      }
    };

    const fetchCompletions = async () => {
      if (!isAuthenticated || !token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalCompletions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const completionData: CompletionMap = await res.json();
          setCompletedDays(completionData);
          setIsCompleted(completionData[dateStr]?.completed || false);
        }
      } catch (err) {
        console.error('Error fetching completions:', err);
      }
    };

    fetchChallenge();
    fetchCompletions();
  }, [isAuthenticated, token, dateStr]);

  const handleDayClick = (date: dayjs.Dayjs) => {
    const target = date.format('YYYY-MM-DD');
    router.push(`/challenges/${target}`);
  };

  const toggleCompleted = async () => {
    if (!token) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalCompletions`, {
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
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-5xl font-extrabold text-white text-center tracking-tight mb-2">
        {today.format('MMMM D, YYYY')}
      </h1>
      <p className="text-lg text-gray-100 mb-10">Another great day to make a change!</p>

      {!showChallenge && (
        <button
          className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={() => setShowChallenge(true)}
        >
          Reveal Daily Challenge
        </button>
      )}

      {showChallenge && (
        <>
          {challenge ? (
            <DailyChallengeCard
              challenge={challenge}
              completed={isCompleted}
              onToggleComplete={toggleCompleted}
              showLoginPrompt={!isAuthenticated}
            />
          ) : (
            <div className="p-6 rounded-xl shadow-lg bg-white/80 text-center max-w-md w-full text-gray-700">
              {challengeError ? 'No challenge set.' : 'Loading...'}
            </div>
          )}
        </>
      )}

      <div className="w-full max-w-2xl px-4 mt-8">
        <Calendar year={year} month={month} completedDays={completedDays} onDayClick={handleDayClick} />
      </div>
    </div>
  );
}
