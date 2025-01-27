import { html } from "htm/react";
import { DateProvider } from "./context/DateContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import Sidebar from "./containers/Sidebar";
import CalendarView from "./containers/CalendarView";

export default () => {
  return html`
    <${DateProvider}>
      <div className="flex h-screen w-full">
        <${ScheduleProvider}>
          <${Sidebar} />
          <${CalendarView} />
        </${ScheduleProvider}>
      </div>
    </>
  `;
};
