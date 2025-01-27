import { html } from 'htm/react';
import { jsonToMap } from '../api/json-map-switch';
import ButtonSquare from './ButtonSquare';
import ButtonCircle from './ButtonCircle';
import useDate from '../hooks/useDate';
import useSchedule from '../hooks/useSchedule';

export default ({ handleMakeCreateVisible }) => {
  const { currentDate, changeWeek, handleToday } = useDate();
  const {
    db,
    roomIdRef,
    currentCalendarInfo,
    setCurrentCalendarInfo,
    setCurrentSchedule,
  } = useSchedule();

  const handleShowPersonalSchedule = async () => {
    setCurrentCalendarInfo({ name: 'My Calendar' });
    roomIdRef.current = 'MyCalendar';
    const schedule = await db.current.get('schedule');
    if (
      schedule &&
      schedule.value &&
      Object.keys(schedule.value).length !== 0
    ) {
      setCurrentSchedule(jsonToMap(schedule.value.toString()));
    } else {
      setCurrentSchedule(new Map());
    }
  };

  return html`
    <header className="flex flex-col justify-between items-center mb-5">
      <h3 className="w-full text-base py-2.5 text-center">
        ${currentCalendarInfo.name}
      </h3>
      <section className="w-full flex mt-2.5 justify-between items-center">
        <section className="flex items-center justify-between">
          <${ButtonCircle}
            onClick=${handleMakeCreateVisible}
            isActive=${true}
            className='w-[80px] mr-5'
          >
            <span>+</span>
          </>
          <${ButtonSquare} isActive=${true} onClick=${handleToday} className="mr-5">
            Today
          </>
          <div className="flex items-center">
            <${ButtonCircle}
              onClick=${() => changeWeek(-7)}
              isActive=${true}
            >
              <span>${'<'}</span>
            </>
            <${ButtonCircle}
              onClick=${() => changeWeek(7)}
              isActive=${true}
            >
              <span>${'>'}</span>
            </>
          </div>
        </section>
        <section className="flex items-center justify-between">
          <h2 className="flex items-center mr-7.5 text-2xl" id="month-year">
            ${currentDate.toLocaleString('default', { month: 'long' })} ${' '}
            ${currentDate.getFullYear()}
          </h2>
        </section>
        <div className="flex items-center w-[180px] justify-between">
          <${ButtonSquare} isActive=${roomIdRef.current !== 'MyCalendar'} onClick=${handleShowPersonalSchedule}>
            <span className="text-xs">My Calendar</span>
          </>
          <${ButtonSquare} isActive=${false}>
            Week
          </>
        </div>
      </section>
    </header>
  `;
};
