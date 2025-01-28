import { html } from 'htm/react';
import { jsonToMap } from '../utils/json-map-switch';
import Button from './Button';
import NavigationButtonGroup from './NavigationButtonGroup';
import useDate from '../hooks/useDate';
import useSchedule from '../hooks/useSchedule';

export default ({ handleMakeCreateVisible }) => {
  const { currentDate, changeWeek, handleToday } = useDate();
  const { db, roomIdRef, setCurrentSchedule, sharedDbObject } = useSchedule();

  const handleShowPersonalSchedule = async () => {
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
        ${roomIdRef.current === 'MyCalendar' ? 'My Calendar' : sharedDbObject[roomIdRef.current].info.name || 'Unnamed Calendar'}
      </h3>
      <section className="w-full flex mt-2.5 justify-between items-center">
        <section className="flex items-center justify-between">
          <${Button}
          variant=${'circle'}
            onClick=${handleMakeCreateVisible}
            className='w-[80px] mr-5'
          >
            <span>+</span>
          </>
          <${Button} variant=${'square'} onClick=${handleToday} isDisabled=${currentDate.toDateString() === new Date().toDateString()} className="mr-5">
            Today
          </>
          <${NavigationButtonGroup}
            onLeftClick=${() => changeWeek(-7)}
            onRightClick=${() => changeWeek(7)}
          />
        </section>
        <section className="flex items-center justify-between">
          <h2 className="flex items-center mr-7.5 text-2xl" id="month-year">
            ${currentDate.toLocaleString('default', { month: 'long' })} ${' '}
            ${currentDate.getFullYear()}
          </h2>
        </section>
        <div className="flex items-center w-[180px] justify-between">
          <${Button} variant=${'square'} isDisabled=${roomIdRef.current === 'MyCalendar'} onClick=${handleShowPersonalSchedule}>
            <span className="text-xs">My Calendar</span>
          </>
          <${Button} variant=${'square'} isDisabled=${true}>
            Week
          </>
        </div>
      </section>
    </header>
  `;
};
