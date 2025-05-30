'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dayjs from 'dayjs';

interface Challenge {
  id: string;
  title: string;
  description: string;
  date: string;
}

export default function ChallengeByDatePage() {
  const params = useParams();
  const rawDate = params.date;
  const date = typeof rawDate === 'string' ? rawDate : rawDate?.[0] || '';
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const { token, isAuthenticated, user } = useAuth();
  const parseddate = dayjs(date);
  const isFuture = parseddate.isAfter(dayjs(), 'day');

  if (isFuture) {
    return(
      <div className='text-center mt-20 text-gray-600'>
        <p>This challenge hasn't ben revealed yet. Come back on {parseddate.format('MMMM D, YYYY')}!</p>
      </div>
    )
  }

  useEffect(() => {
    if (!date) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalChallenge/${date}`)
      .then((res) => res.json())
      .then(setChallenge);

    if (isAuthenticated && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalCompletions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          setCompleted(data[date] || false);
        });
    }
  }, [date, isAuthenticated, token]);

  const toggleCompleted = async () => {
    if (!token) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/globalCompletions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date, completed: !completed }),
    });

    if (res.ok) {
      setCompleted(!completed);
    }
  };


  if (!challenge) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white/80 p-6 rounded-xl shadow backdrop-blur-sm">
      <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
      <p className="text-gray-700 mb-4">{challenge.description}</p>
      <p className="text-sm text-gray-500 mb-4">{challenge.date}</p>

      {isAuthenticated && (
        <button
          onClick={toggleCompleted}
          className={`px-4 py-2 rounded text-white ${
            completed ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {completed ? 'Mark as Incomplete' : 'Mark as Completed'}
        </button>
      )}

    </div>
  );
}
