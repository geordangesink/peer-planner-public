import { html } from 'htm/react';
import { useState, useEffect } from 'react';
import useDate from '../hooks/useDate';
import ButtonCircle from './ButtonCircle';

// displayed month quick-pick
export default () => {
  const { currentDate, setDate } = useDate();
  const [sidebarMonth, setSidebarMonth] = useState(currentDate);

  useEffect(() => {
    setSidebarMonth(currentDate);
  }, [currentDate]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    return new Date(year, month + 1, 0).getDate();
  };

  // formatter for weekday abreviation
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

  // store current and previous month and days
  const currentMonth = sidebarMonth.getMonth();
  const daysInMonth = getDaysInMonth(sidebarMonth);
  const previousMonthDays = getDaysInMonth(
    new Date(sidebarMonth.getFullYear(), sidebarMonth.getMonth() - 1)
  );
  const previousMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;

  // calculate the day of the week the current month starts on
  let startDayOfMonth = new Date(
    sidebarMonth.getFullYear(),
    currentMonth,
    1
  ).getDay();
  // startDayOfMonth = startDayOfMonth === 0 ? 6 : startDayOfMonth - 1; // only for Mondays, delete for Sundays (for where the week starts)

  // array to hold the days to be displayed
  const displayedMonthDays = [];

  // days from the previous month
  for (let i = startDayOfMonth - 1; i >= 0; i--) {
    displayedMonthDays.push({
      day: previousMonthDays - i,
      type: 'prev',
      key: `prev-${previousMonthDays - i}`,
      date: new Date(
        sidebarMonth.getFullYear(),
        previousMonthIndex,
        previousMonthDays - i + 0 // 1 for Mondays, 0 for Sundays (where the week start)
      ),
    });
  }

  // days from the current month
  for (let i = 1; i <= daysInMonth; i++) {
    displayedMonthDays.push({
      day: i,
      type: 'current',
      key: `current-${i}`,
      date: new Date(sidebarMonth.getFullYear(), currentMonth, i),
    });
  }

  // days from the next month
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  for (let i = 1; displayedMonthDays.length < 42; i++) {
    displayedMonthDays.push({
      day: i,
      type: 'next',
      key: `next-${i}`,
      date: new Date(sidebarMonth.getFullYear(), nextMonthIndex, i),
    });
  }

  // handler for day clicks
  const handleDayClick = (dayObj) => {
    setDate(dayObj.date); // set the date to the clicked day
  };

  // handle month change
  const handleMonthChange = (userInput) => {
    const newDate = new Date(sidebarMonth);
    newDate.setFullYear(
      newDate.getFullYear() + Math.floor((newDate.getMonth() + userInput) / 12)
    );
    newDate.setMonth(
      newDate.getMonth() + userInput >= 0
        ? (newDate.getMonth() + userInput) % 12
        : (12 + ((newDate.getMonth() + userInput) % 12)) % 12
    );
    setSidebarMonth(newDate);
  };

  return html`
    <section
      className="flex w-full mt-[10px] border-b border-[rgba(128,128,128,0.4)] flex-col items-center"
    >
      <div className="flex justify-between items-center w-[224px]">
        <h4 className="ml-[10px]">
          ${sidebarMonth.toLocaleString('default', { month: 'long' })}${' '}
          ${sidebarMonth.getFullYear()}
        </h4>
        <div className="flex">
          <${ButtonCircle}
            isActive=${true}
            onClick=${async () => handleMonthChange(-1)}
          >
            <span>${'<'}</span>
          </>
          <${ButtonCircle}
            isActive=${true}
            onClick=${async () => handleMonthChange(1)}
          >
            <span>${'>'}</span>
          </>
        </div>
      </div>
      <div
        className="grid mb-[10px] grid-rows-[repeat(7,_1fr)] grid-cols-[repeat(7,_1fr)] text-[0.7rem]"
      >
        ${Array.from(
          { length: 7 },
          (_, index) => html`
            <div
              key=${index + 'month-days-label'}
              className="flex h-[24px] w-[24px] m-[3px] rounded-full justify-center items-center"
            >
              <span>${formatter.format(new Date(2023, 0, index + 1))}</span>
            </div>
          `
        )}
        ${displayedMonthDays.map(
          (dayObj) => html`
            <div
              key=${dayObj.key + 'month-days-day'}
              className=${`flex h-[24px] w-[24px] m-[3px] rounded-full justify-center items-center hover:bg-[rgb(99,99,99)] cursor-pointer
                ${dayObj.type === 'current' ? 'current-day' : 'text-gray-500'}
                ${dayObj.date.toDateString() === new Date(currentDate).toDateString() ? 'bg-[rgb(39,39,39)] border-[1px] border-black [border-style:inset]' : dayObj.date.toDateString() === new Date().toDateString() ? 'bg-gray-600' : ''}`}
              onClick=${() => handleDayClick(dayObj)}
            >
              ${dayObj.day}
            </div>
          `
        )}
      </div>
    </section>
  `;
};
