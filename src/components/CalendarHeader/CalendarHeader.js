import { html } from "htm/react";
import { jsonToMap } from "../../api/json-map-switch";
import useDate from "../../hooks/useDate";
import useSchedule from "../../hooks/useSchedule";

export default ({ handleMakeCreateVisible }) => {
  const { currentDate, changeWeek, handleToday } = useDate();
  const { db, roomIdRef, currentCalendarInfo, setCurrentCalendarInfo, setCurrentSchedule } = useSchedule();

  const handleShowPersonalSchedule = async () => {
    setCurrentCalendarInfo({ name: "My Calendar" });
    roomIdRef.current = "MyCalendar";
    const schedule = await db.current.get("schedule");
    if (schedule && schedule.value && Object.keys(schedule.value).length !== 0) {
      setCurrentSchedule(jsonToMap(schedule.value.toString()));
    } else {
      setCurrentSchedule(new Map());
    }
  };

  return html`
    <header className="calendar-header">
      <h3>${currentCalendarInfo.name}</h3>
      <section className="controls">
        <section className="add-and-today">
          <button className="circle-button" id="create-activity-button" onClick=${handleMakeCreateVisible}>
            <span>+</span>
          </button>
          <button className="button-square" id="today" onClick=${handleToday}>
            <span>Today</span>
          </button>
        </section>
        <section className="month-year big">
          <div className="switch-buttons">
            <button className="circle-button" onClick=${() => changeWeek(-7)}>
              <span>${"<"}</span>
            </button>
            <button className="circle-button" onClick=${() => changeWeek(7)}>
              <span>${">"}</span>
            </button>
          </div>
          <h2 id="month-year">
            ${currentDate.toLocaleString("default", { month: "long" })} ${" "} ${currentDate.getFullYear()}
          </h2>
        </section>
        <div className="choose-timespan-and-my-calendar">
          <button
            className="my-calendar button-square ${roomIdRef.current === "MyCalendar" ? "not-clickable" : ""}"
            onClick=${handleShowPersonalSchedule}
          >
            <span>My Calendar</span>
          </button>
          <button className="not-clickable">Week</button>
        </div>
      </section>
    </header>
  `;
};
