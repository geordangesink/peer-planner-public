import { html } from 'htm/react';
import { useState, useEffect } from 'react';
import useSchedule from '../../hooks/useSchedule';

/**
 * Header elements of the Calendar app
 */
export default () => {
  const { localIdRef, sharedDbObject } = useSchedule();
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    // cleanup the interval on component unmount
    return () => clearInterval(timer);
  }, []);

  // Custom formatting for date and time
  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formattedDate = formatDate(dateTime);

  return html` <header className="flex items-center">
    <div
      className="flex justify-end items-center w-nav h-title-bar border-r border-b border-gray-40 bg-sidebar pt-[5px]"
    >
      <h4 className="mr-6">${formattedDate}</h4>
    </div>
    <div
      className="flex flex-grow items-center justify-center h-title-bar border-b border-gray-40 pt-[5px]"
    >
      <h3>
        ${localIdRef.current === 'MyCalendar'
          ? 'My Calendar'
          : sharedDbObject[localIdRef.current].custom?.name || 'Unnamed Calendar'}
      </h3>
    </div>
  </header>`;
};
