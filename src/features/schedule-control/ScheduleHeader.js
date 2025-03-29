import { html } from 'htm/react';
import Button from '../../components/Button';
import NavigationButtonGroup from '../../components/NavigationButtonGroup';
import useDate from '../../hooks/useDate';
import useSchedule from '../../hooks/useSchedule';
import { useCallback, useMemo } from 'react';

/**
 * Header controls for the currently selected schedule.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.handleMakeEditVisible] - Callback function to make the edit controls visible.
 */
export default ({ handleMakeEditVisible }) => {
  const { currentDate, changeWeek, handleToday } = useDate();
  const { roomManagerRef, localIdRef, changeDisplayedSchedule } = useSchedule();

  // memoize the function to show personal schedule
  const handleShowPersonalSchedule = useCallback(async () => {
    localIdRef.current = 'MyCalendar';
    const schedule = await roomManagerRef.current.get('schedule');
    console.log(schedule)
    if (schedule) {
      changeDisplayedSchedule(schedule);
    } else {
      changeDisplayedSchedule(new Map());
    }
  }, [roomManagerRef, changeDisplayedSchedule, localIdRef]);

  // memoize the navigation to change week
  const handleWeekChange = useCallback(
    (direction) => {
      changeWeek(direction * 7);
    },
    [changeWeek]
  );

  // check if today button should be disabled
  const isTodayDisabled = useMemo(
    () => currentDate.toDateString() === new Date().toDateString(),
    [currentDate]
  );

  console.log('rendered ScheduleHeader');

  return html`
    <div className="flex flex-col justify-between items-center mb-5">
      <section className="w-full flex mt-2.5 justify-between items-center">
        <section className="flex items-center justify-between">
          <${Button}
            variant="circle"
            onClick=${handleMakeEditVisible}
            className="w-[80px] mr-5"
          >
            <span>+</span>
          </${Button}>
          <${Button}
            variant="square"
            onClick=${handleToday}
            isDisabled=${isTodayDisabled}
            className="mr-5"
          >
            Today
          </${Button}>
          <${NavigationButtonGroup}
            onLeftClick=${() => handleWeekChange(-1)} 
            onRightClick=${() => handleWeekChange(1)}
          />
        </section>
        <section className="flex items-center justify-between">
          <h2 className="flex items-center mr-7.5 text-2xl" id="month-year">
            ${currentDate.toLocaleString('default', { month: 'long' })} ${' '}
            ${currentDate.getFullYear()}
          </h2>
        </section>
        <div className="flex items-center w-[180px] justify-between">
          <${Button}
            variant="square"
            isDisabled=${localIdRef.current === 'MyCalendar'}
            onClick=${handleShowPersonalSchedule}
          >
            <span className="text-xs">My Calendar</span>
          </${Button}>
          <${Button} variant="square" isDisabled=${true}>
            Week
          </${Button}>
        </div>
      </section>
    </div>
  `;
};
