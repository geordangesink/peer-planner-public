import { html } from 'htm/react';
import { useState } from 'react';
import CalendarHeader from '../components/CalendarHeader';
import CalendarInterfaceWeek from '../features/week-interface/CalendarInterfaceWeek';
import ConfigureActivity from '../features/configure-activity/ConfigureActivity';
import ThisOrAllChange from '../components/ThisOrAllChange';
import useIsVisible from '../hooks/useIsVisible';
import useSchedule from '../hooks/useSchedule';
import adjustScheduleDrag from '../api/CalendarInterface/weekInterface/adjustScheduleDrag';

export default () => {
  const configureActivityComp = useIsVisible();
  const thisOrAllChangeComp = useIsVisible();
  const { currentSchedule, setSchedule } = useSchedule();
  const [tempEventSave, setTempEventSave] = useState(undefined); // when intermediate user input is needed (this or all change)
  const [tempNewScheduleSaved, setTempNewScheduleSaved] = useState({}); // save the edit window config if needed
  const [oldActivityData, setOldActivityData] = useState();
  const [dragPreviewStyle, setDragPreviewStyle] = useState({ display: 'none' });
  const [isCreate, setIsCreate] = useState(true);
  const [isDelete, setIsDelete] = useState(false);
  const [isFirstRepeating, setIsFirstRepeating] = useState();
  // TODO: change some states to refs???

  const requestScheduleChange = (event = undefined, newSchedule = {}) => {
    const detailsMap = oldActivityData.detailsMap;

    if (detailsMap.get('repeat') === 'no-repeat') {
      handleScheduleChange(undefined, event, newSchedule);
    } else {
      // check if the edited activity is the first of the repeating
      if (
        oldActivityData.startTime.getTime() ===
        currentSchedule
          .get(oldActivityData.detailsMap.get('repeat'))
          .get(oldActivityData.key)
          .get('from')
          .getTime()
      )
        setIsFirstRepeating(true);
      else setIsFirstRepeating(false);
      setIsDelete(false);
      setTempEventSave(event);
      setTempNewScheduleSaved(newSchedule);
      setDragPreviewStyle({ display: 'none' });
      thisOrAllChangeComp.handleMakeVisible();
    }
  };

  // TODO: make it less repetative
  const requestDeleteActivity = () => {
    const updatedSchedule = new Map(currentSchedule);
    const detailsMap = oldActivityData.detailsMap;

    if (detailsMap.get('repeat') === 'no-repeat') {
      updatedSchedule
        .get(detailsMap.get('from').toISOString())
        .delete(oldActivityData.key);
      if (!updatedSchedule.get(detailsMap.get('from').toISOString()).size)
        updatedSchedule.delete(detailsMap.get('from').toISOString());

      setSchedule(updatedSchedule);
    } else {
      // check if the edited activity is the first of the repeating
      if (
        oldActivityData.startTime.getTime() ===
        currentSchedule
          .get(oldActivityData.detailsMap.get('repeat'))
          .get(oldActivityData.key)
          .get('from')
          .getTime()
      )
        setIsFirstRepeating(true);
      else setIsFirstRepeating(false);
      setIsDelete(true);
      thisOrAllChangeComp.handleMakeVisible();
    }
  };

  const handleScheduleChange = (
    ThisOrAllChangeInput = undefined,
    e = undefined,
    newS = undefined
  ) => {
    const event = e || tempEventSave;
    const newSchedule = newS || tempNewScheduleSaved;
    let dayIndex;
    let timeIndex;
    // if drag and dropped (not edit window)
    if (event) {
      event.preventDefault();
      // get the data of dragged activity
      const { dayIndexOffsetPx } = oldActivityData;
      // get the grid container and its dimensions
      ({ dayIndex, timeIndex } = getGridLocation(event, dayIndexOffsetPx));
    }
    const updated = adjustScheduleDrag(currentSchedule, {
      thisOrAll: ThisOrAllChangeInput,
      oldActivityData,
      newSchedule,
      dayIndex,
      timeIndex,
    });

    setSchedule(updated);
    setTempNewScheduleSaved({});
    setTempEventSave(undefined);
    setOldActivityData(undefined);
    setDragPreviewStyle({ display: 'none' });
  };

  const handleDeleteRepeatActivity = (ThisOrAllChangeInput = undefined) => {
    const updatedSchedule = new Map(currentSchedule);
    const detailsMap = oldActivityData.detailsMap;

    if (ThisOrAllChangeInput === 'all') {
      updatedSchedule.get(detailsMap.get('repeat')).delete(oldActivityData.key);
    } else if (ThisOrAllChangeInput === 'this') {
      const dateExceptionsArr = updatedSchedule
        .get(detailsMap.get('repeat'))
        .get(oldActivityData.key)
        .get('dateExceptions');
      dateExceptionsArr.push([
        oldActivityData.startTime.toISOString(),
        oldActivityData.endTime.toISOString(),
        'deleted',
      ]);
    } else if (ThisOrAllChangeInput === 'allFollowing') {
      updatedSchedule
        .get(detailsMap.get('repeat'))
        .get(oldActivityData.key)
        .set('endRepeat', new Date(oldActivityData.startTime.toDateString()));
    }
    setOldActivityData(undefined);
    setSchedule(updatedSchedule);
  };

  return html`
    <main className="w-calendar-view h-full flex-grow p-5 pt-0 pb-2 pr-3 flex flex-col">
      <${CalendarHeader} 
        handleMakeCreateVisible=${configureActivityComp.handleMakeVisible}
      />
      <${CalendarInterfaceWeek} 
        getGridLocation=${getGridLocation}
        requestScheduleChange=${requestScheduleChange}
        handleMakeCreateVisible=${configureActivityComp.handleMakeVisible}
        setOldActivityData=${setOldActivityData}
        dragPreviewStyle=${dragPreviewStyle}
        setDragPreviewStyle=${setDragPreviewStyle}
        setIsCreate=${setIsCreate}
      >
      </>
      <${ConfigureActivity}
        onClose=${() => (configureActivityComp.handleMakeInvisible(), setIsCreate(true))}
        requestScheduleChange=${requestScheduleChange}
        requestDeleteActivity=${requestDeleteActivity}
        oldActivityData=${oldActivityData}
        isVisible=${configureActivityComp.isVisible}
        isCreate=${isCreate}
        title="Create New Activity"
      >
      </>
      <${ThisOrAllChange}
        onClose=${thisOrAllChangeComp.handleMakeInvisible}
        handleScheduleChange=${handleScheduleChange}
        handleDeleteRepeatActivity=${handleDeleteRepeatActivity}
        isVisible=${thisOrAllChangeComp.isVisible}
        isDelete=${isDelete}
        isFirstRepeating=${isFirstRepeating}
        title="ThisOrAllChange"
      >
      </> 
    </main>
  `;
};

// TODO: Make this its own api file
// calcualate grid location of react events
// WEEK interface
function getGridLocation(event, dayIndexOffsetPx = false) {
  // get the grid container and its dimensions
  const gridContainer = document.querySelector('#scheduleActivities');
  const gridRect = gridContainer.getBoundingClientRect();
  const columnWidth = gridRect.width / 7; // Width of each day column
  const rowHeight = gridRect.height / 96; // Height of each 15-minute slot

  // relative mouse positions
  const relativeX = event.clientX - gridRect.left;
  const relativeY = event.clientY - gridRect.top;

  let dayIndex = Math.floor(relativeX / columnWidth);
  let timeIndex = Math.floor(relativeY / rowHeight);
  // calculate column and row index
  if (dayIndexOffsetPx) {
    dayIndex = Math.floor((relativeX + dayIndexOffsetPx) / columnWidth);
  }

  return {
    dayIndex,
    relativeX,
    columnWidth,
    timeIndex,
    rowHeight,
    gridContainer,
  };
}
