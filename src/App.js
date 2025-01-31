import { html } from 'htm/react';
import { DateProvider } from './context/DateContext';
import { ScheduleProvider } from './context/ScheduleContext';
import ControlBar from './features/window-header/ControlBar';
import Header from './features/window-header/Header';
import Sidebar from './containers/Sidebar';
import ScheduleView from './containers/ScheduleView';

export default () => {
  return html`
    <${ControlBar} />
    <${ScheduleProvider}>
      <${Header} />
      <${DateProvider}>
        <div className="flex h-screen w-full">
          <${Sidebar} />
          <${ScheduleView} />
        </>
      </>
    </>
  `;
};
