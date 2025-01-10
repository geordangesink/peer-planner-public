import { html } from "htm/react";
import { createContext, useState } from "react";

const DateContext = createContext();

const DateProvider = ({ children }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // change the displayed month
  const changeMonth = (userInput) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(
      newDate.getFullYear() + Math.floor((newDate.getMonth() + userInput) / 12)
    );
    newDate.setMonth(
      newDate.getMonth() + userInput >= 0
        ? (newDate.getMonth() + userInput) % 12
        : (12 + ((newDate.getMonth() + userInput) % 12)) % 12
    );
    setCurrentDate(newDate);
  };

  // change the displayed week
  const changeWeek = (userInput) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + userInput);
    setCurrentDate(newDate);
  };

  // set the date to today
  const handleToday = () => setCurrentDate(new Date());

  // directly set the date (e.g., when a user clicks on a specific day)
  const setDate = (date) => {
    setCurrentDate(new Date(date));
  };

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
