'use client';

import dayjs from 'dayjs';

type CalendarProps = {
  year: number;
  month: number;
  completedDays: Record<string, { completed: boolean; completedAt: string }>;
  onDayClick: (date: dayjs.Dayjs) => void;
};

const getDaysInMonth = (year: number, month: number) => {
  const days = [];
  const date = dayjs(`${year}-${month + 1}-01`);
  const daysInMonth = date.daysInMonth();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(dayjs(new Date(year, month, i)));
  }
  return days;
};

export default function Calendar({ year, month, completedDays, onDayClick }: CalendarProps) {
  return (
    <div className="p-4 bg-slate-600 rounded-xl shadow backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-center text-gray-200 mb-4">
        {dayjs(new Date(year, month)).format('MMMM YYYY')}
      </h1>

      <div className="grid grid-cols-7 gap-2">
        {getDaysInMonth(year, month).map((date) => {
          const dateKey = date.format('YYYY-MM-DD');
          const record = completedDays[dateKey];
          const isComplete = record?.completed;
          const completedAt = record?.completedAt ? dayjs(record.completedAt) : null;
          const isRetro = isComplete && completedAt && completedAt.isAfter(date, 'day');

          return (
            <button
              key={dateKey}
              onClick={() => onDayClick(date)}
              className={`aspect-square w-full rounded-md text-sm font-medium transition-all ${
                isComplete
                  ? isRetro
                    ? 'bg-yellow-500 text-white'
                    : 'bg-green-400 text-white'
                  : 'bg-gray-300 text-gray-800 hover:bg-gray-400'
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
