import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../src/components/Calendar';
import dayjs from 'dayjs';

describe('Calendar', () => {
  const mockOnDayClick = jest.fn();

  const baseDate = dayjs('2025-05-01');
  const year = baseDate.year();
  const month = baseDate.month(); // 0-indexed

  const completedDays = {
    '2025-05-03': {
      completed: true,
      completedAt: '2025-05-03T10:00:00.000Z',
    },
    '2025-05-04': {
      completed: true,
      completedAt: '2025-05-06T10:00:00.000Z', // retroactive
    },
  };

  beforeEach(() => {
    mockOnDayClick.mockReset();
  });

  test('renders the correct month and year header', () => {
    render(<Calendar year={year} month={month} completedDays={{}} onDayClick={mockOnDayClick} />);
    expect(screen.getByText('May 2025')).toBeInTheDocument();
  });

  test('renders all days of the month', () => {
    render(<Calendar year={year} month={month} completedDays={{}} onDayClick={mockOnDayClick} />);
    const numDays = baseDate.daysInMonth();
    for (let i = 1; i <= numDays; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  test('renders completed and retroactively completed days with correct styles', () => {
    render(<Calendar year={year} month={month} completedDays={completedDays} onDayClick={mockOnDayClick} />);

    const completeDay = screen.getByText('3');
    const retroDay = screen.getByText('4');

    expect(completeDay).toHaveClass('bg-green-400');
    expect(retroDay).toHaveClass('bg-yellow-500');
  });

  test('calls onDayClick with correct date when a day is clicked', () => {
    render(<Calendar year={year} month={month} completedDays={{}} onDayClick={mockOnDayClick} />);
    const targetDay = screen.getByText('10');
    fireEvent.click(targetDay);

    expect(mockOnDayClick).toHaveBeenCalledTimes(1);
    expect(mockOnDayClick.mock.calls[0][0].format('YYYY-MM-DD')).toBe('2025-05-10');
  });
});
