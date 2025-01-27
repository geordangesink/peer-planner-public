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
<<<<<<< HEAD
        <section className="flex items-center add-and-today">
          <button
            className="flex items-center h-[30px] w-[80px] m-1.25 rounded-full bg-gray-68 hover:bg-hoverButton hover:border border-black mr-5"
=======
        <section className="flex items-center justify-between">
          <${ButtonCircle}
>>>>>>> tailwind
            onClick=${handleMakeCreateVisible}
            isActive=${true}
            className='w-[80px] mr-5'
          >
            <span>+</span>
<<<<<<< HEAD
          </button>
          <button className="flex items-center w-[80px] hover:bg-hoverButton" onClick=${handleToday}>
            <span>Today</span>
          </button>
          <div className="flex items-center mr-7.5">
            <button
              className="flex items-center h-[30px] w-[30px] m-1.25 rounded-full hover:bg-hoverButton"
              onClick=${() => changeWeek(-7)}
            >
              <span>${"<"}</span>
            </button>
            <button
              className="flex items-center h-[30px] w-[30px] m-1.25 rounded-full hover:bg-hoverButton"
              onClick=${() => changeWeek(7)}
            >
              <span>${">"}</span>
            </button>
=======
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
>>>>>>> tailwind
          </div>
        </section>
        <section className="flex items-center justify-between">
          <h2 className="flex items-center mr-7.5 text-2xl" id="month-year">
            ${currentDate.toLocaleString('default', { month: 'long' })} ${' '}
            ${currentDate.getFullYear()}
          </h2>
        </section>
        <div className="flex items-center w-[180px] justify-between">
<<<<<<< HEAD
          <button
            className="flex items-center mr-5 h-[30px] w-[80px] border border-[rgba(128,128,128,0.4)] ${roomIdRef.current ===
            "MyCalendar"
              ? "bg-[#3a3d42] border border-black border-inset opacity-80 cursor-default flex items-center justify-center h-[30px] w-[80px]"
              : ""}"
            onClick=${handleShowPersonalSchedule}
          >
            <span className="text-xs">My Calendar</span>
          </button>
          <button
            className="flex items-center bg-[#3a3d42] border border-black border-inset opacity-80 cursor-default justify-center h-[30px] w-[80px]"
          >
=======
          <${ButtonSquare} isActive=${roomIdRef.current !== 'MyCalendar'} onClick=${handleShowPersonalSchedule}>
            <span className="text-xs">My Calendar</span>
          </>
          <${ButtonSquare} isActive=${false}>
>>>>>>> tailwind
            Week
          </>
        </div>
      </section>
    </header>
  `;
};
