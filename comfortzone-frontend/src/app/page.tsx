'use client';
import { useEffect, useState } from 'react';
import DailyChallengeCard from "@/components/DailyChallengeCard";
import dayjs from 'dayjs';

export default function Home() {
  const [today, setToday] = useState('');

  useEffect(() => {
    setToday(dayjs().format('dddd, MMMM D, YYYY')); // e.g., "Friday, May 10, 2025"
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h1 className="text-5xl font-extrabold text-white text-center tracking-tight mb-2">
        ComfortZone
      </h1>
      <p className="text-lg text-gray-100 mb-10">{today}</p>

      <DailyChallengeCard challenge="13 Spins" />
    </div>
  );
}
