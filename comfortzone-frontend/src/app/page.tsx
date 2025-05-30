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

    useEffect(() => {
      const fetchAll = async () => {
        if (!token) return;
  
        try {
          const [challengeRes, completionsRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalChallenge/${dateStr}`),
            fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalCompletions`, {
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
        ComfortZone
      </h1>
      <p className="text-lg text-gray-100 mb-10">{today.format('MMMM D, YYYY')}</p>


      <DailyChallengeCard challenge="13 Spins" />

      <div className="w-full max-w-2xl px-4 mt-8">
        <Calendar
          year={year}
          month={month}
          completedDays={completedDays}
          onDayClick={handleDayClick}
        />
      </div>

    </div>
  );
}
