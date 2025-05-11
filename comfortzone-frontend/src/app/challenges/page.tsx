'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

type CompletionMap = Record<string, boolean>;

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
  const [completedDays, setCompletedDays] = useState<CompletionMap>({});

  const today = dayjs();
  const year = today.year();
  const month = today.month(); // 0-indexed

  useEffect(() => {
    const stored = localStorage.getItem('completedDays');
    if (stored) setCompletedDays(JSON.parse(stored));
  }, []);

  const handleDayClick = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    router.push(`/challenges/${dateStr}`);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white/80 rounded-xl shadow backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
        {today.format('MMMM YYYY')}
      </h1>
      <div className="grid grid-cols-7 gap-2">
        {getDaysInMonth(year, month).map((date) => {
          const dateStr = date.format('YYYY-MM-DD');
          const isComplete = completedDays[dateStr];

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={`aspect-square w-full rounded-md text-sm font-medium transition-all ${
                isComplete ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
              }`}
            >
              {date.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
