import { html } from "htm/react";
import { DateProvider } from "./context/DateContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import Sidebar from "./containers/Sidebar";
import CalendarView from "./containers/CalendarView";

export default () => {
  return html`
    <${DateProvider}>
      <div className="container">
        <${ScheduleProvider}>
          <${Sidebar} />
          <${CalendarView} />
        </${ScheduleProvider}>
      </div>
    </>
  `;
};
