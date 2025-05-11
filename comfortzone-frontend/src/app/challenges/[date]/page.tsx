'use client';

import { useParams } from 'next/navigation';
import dayjs from 'dayjs';

export default function ChallengeDayPage() {
  const { date } = useParams();

  const parsed = typeof date === 'string' ? dayjs(date) : dayjs();

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white/80 p-6 rounded-xl shadow-md backdrop-blur-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Challenge for {parsed.format('MMMM D, YYYY')}
      </h1>

      <p className="text-gray-700 mb-6">
        Your challenge: <span className="font-semibold">Talk to a stranger today</span>
      </p>

      <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
        Mark as Complete
      </button>
    </div>
  );
}
