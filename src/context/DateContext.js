import { html } from 'htm/react';
import { createContext, useState, useCallback } from 'react';

// Create the DateContext
const DateContext = createContext();

const DateProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper function to get the new month after change
  const getNewMonthDate = (userInput) => {
    const newDate = new Date(currentDate); // Create a copy to avoid mutation
    newDate.setFullYear(
      newDate.getFullYear() + Math.floor((newDate.getMonth() + userInput) / 12)
    );
    newDate.setMonth((newDate.getMonth() + userInput + 12) % 12);
    return newDate;
  };

  // change the displayed month (memoized function)
  const changeMonth = useCallback(
    (userInput) => {
      const newDate = getNewMonthDate(userInput);
      setCurrentDate(newDate);
    },
    [currentDate]
  );

  // change the displayed week (memoized function)
  const changeWeek = useCallback(
    (userInput) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + userInput);
      setCurrentDate(newDate);
    },
    [currentDate]
  );

  // set the date to today (memoized function)
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // directly set the date when a user clicks on a specific day (memoized function)
  const setDate = useCallback((date) => {
    setCurrentDate(new Date(date));
  }, []);

  return html`
    <${DateContext.Provider}
      value=${{
        currentDate,
        changeMonth,
        changeWeek,
        handleToday,
        setDate,
      }}
    >
      ${children}
    </>
  `;
};

export { DateContext, DateProvider };
