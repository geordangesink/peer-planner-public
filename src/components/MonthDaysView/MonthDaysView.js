import { html } from "htm/react";
import { useState, useEffect } from "react";
import useDate from "../../hooks/useDate";
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
  const formatter = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });

  // store current and previous month and days
  const currentMonth = sidebarMonth.getMonth();
  const daysInMonth = getDaysInMonth(sidebarMonth);
  const previousMonthDays = getDaysInMonth(new Date(sidebarMonth.getFullYear(), sidebarMonth.getMonth() - 1));
  const previousMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;

  // calculate the day of the week the current month starts on
  let startDayOfMonth = new Date(sidebarMonth.getFullYear(), currentMonth, 1).getDay();
  // startDayOfMonth = startDayOfMonth === 0 ? 6 : startDayOfMonth - 1; // only for Mondays, delete for Sundays (for where the week starts)

  // array to hold the days to be displayed
  const displayedMonthDays = [];

  // days from the previous month
  for (let i = startDayOfMonth - 1; i >= 0; i--) {
    displayedMonthDays.push({
      day: previousMonthDays - i,
      type: "prev",
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
      type: "current",
      key: `current-${i}`,
      date: new Date(sidebarMonth.getFullYear(), currentMonth, i),
    });
  }

  // days from the next month
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  for (let i = 1; displayedMonthDays.length < 42; i++) {
    displayedMonthDays.push({
      day: i,
      type: "next",
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
    newDate.setFullYear(newDate.getFullYear() + Math.floor((newDate.getMonth() + userInput) / 12));
    newDate.setMonth(
      newDate.getMonth() + userInput >= 0
        ? (newDate.getMonth() + userInput) % 12
        : (12 + ((newDate.getMonth() + userInput) % 12)) % 12
    );
    setSidebarMonth(newDate);
  };

  return html`
    <section className="month-days">
      <div className="month-year month-days-header">
        <h4>${sidebarMonth.toLocaleString("default", { month: "long" })}${" "} ${sidebarMonth.getFullYear()}</h4>
        <div className="switch-buttons">
          <button id="sidebar-month-arrow-left" className="circle-button" onClick=${async () => handleMonthChange(-1)}>
            <span>${"<"}</span>
          </button>
          <button id="sidebar-month-arrow-right" className="circle-button" onClick=${async () => handleMonthChange(1)}>
            <span>${">"}</span>
          </button>
        </div>
      </div>
      <div className="month-days-grid">
        ${Array.from(
          { length: 7 },
          (_, index) => html`
            <div key=${index + "month-days-label"} className="month-days-label">
              <span>${formatter.format(new Date(2023, 0, index + 1))}</span>
            </div>
          `
        )}
        ${displayedMonthDays.map(
          (dayObj) => html`
            <div
              key=${dayObj.key + "month-days-day"}
              className=${`month-days-day 
                ${dayObj.type === "current" ? "current-day" : "greyed-day"}
                ${dayObj.date.toDateString() === new Date(currentDate).toDateString() ? "selected-day" : ""}
                ${dayObj.date.toDateString() === new Date().toDateString() ? "today" : ""}`}
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
