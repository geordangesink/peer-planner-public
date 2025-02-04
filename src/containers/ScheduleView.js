import { html } from 'htm/react';
import { useState } from 'react';
import ScheduleHeader from '../features/schedule-control/ScheduleHeader';
import ScheduleInterfaceWeek from '../features/week-interface/ScheduleInterfaceWeek';
import EditActivity from '../features/configure-activity/EditActivity';
import ThisOrAllChange from '../features/configure-activity/ThisOrAllChange';
import PopupWindow from '../components/PopupWindow';
import useVisibility from '../hooks/useVisibility';
import useSchedule from '../hooks/useSchedule';
import adjustSchedule from '../utils/adjustSchedule';

/**
 * Container for Schedule View on right side (black)
 */
export default () => {
  const visibilityEditActivity = useVisibility();
  const visibilityThisOrAllChange = useVisibility();
  const { currentSchedule, editCurrentSchedule } = useSchedule();
  const [tempEventSave, setTempEventSave] = useState(undefined); // when intermediate user input is needed (this or all change)
  const [tempUpdatedActivitySaved, setTempUpdatedActivitySaved] = useState({}); // save the edit window config if needed
  const [oldActivityData, setOldActivityData] = useState();
  const [isCreate, setIsCreate] = useState(true);
  const [isDelete, setIsDelete] = useState(false);
  const [isFirstRepeating, setIsFirstRepeating] = useState();
  // TODO: change some states to refs???

  console.log('rendered CalendarView');

  const requestScheduleChange = (event = undefined, updatedActivity = {}) => {
    const detailsMap = oldActivityData.detailsMap;

    if (detailsMap.get('repeat') === 'no-repeat') {
      handleScheduleChange(undefined, event, updatedActivity);
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
      setTempUpdatedActivitySaved(updatedActivity);
      visibilityThisOrAllChange.handleMakeVisible();
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

      editCurrentSchedule(updatedSchedule);
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
      visibilityThisOrAllChange.handleMakeVisible();
    }
  };

  const handleScheduleChange = (
    ThisOrAllChangeInput = undefined,
    e = undefined,
    updatedAct = undefined
  ) => {
    const event = e || tempEventSave;
    const updatedActivity = updatedAct || tempUpdatedActivitySaved;
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
    const updated = adjustSchedule(currentSchedule, {
      thisOrAll: ThisOrAllChangeInput,
      oldActivityData,
      updatedActivity,
      dayIndex,
      timeIndex,
    });

    editCurrentSchedule(updated);
    setTempUpdatedActivitySaved({});
    setTempEventSave(undefined);
    setOldActivityData(undefined);
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
    editCurrentSchedule(updatedSchedule);
  };

  return html`
    <main className="w-calendar-view h-full flex-grow p-5 pt-0 pb-2 pr-3 flex flex-col">
      <${ScheduleHeader} 
        handleMakeEditVisible=${visibilityEditActivity.handleMakeVisible}
      />
      <${ScheduleInterfaceWeek} 
        getGridLocation=${getGridLocation}
        requestScheduleChange=${requestScheduleChange}
        handleMakeEditVisible=${visibilityEditActivity.handleMakeVisible}
        setOldActivityData=${setOldActivityData}
        setIsCreate=${setIsCreate}
      >
      </>
      <${PopupWindow}
        isVisible=${visibilityEditActivity.isVisible}
        onClose=${() => (visibilityEditActivity.handleMakeInvisible(), setIsCreate(true))}
        widthPx=${600}
        heightPx=${500}
      >
        <${EditActivity}
          onClose=${() => (visibilityEditActivity.handleMakeInvisible(), setIsCreate(true))}
          requestScheduleChange=${requestScheduleChange}
          requestDeleteActivity=${requestDeleteActivity}
          oldActivityData=${oldActivityData}
          isCreate=${isCreate}
          title="Create New Activity"
        >
        </>
      </>
      <${PopupWindow}
        isVisible=${visibilityThisOrAllChange.isVisible}
        onClose=${visibilityThisOrAllChange.handleMakeInvisible}
        widthPx=${600}
        heightPx=${400}
      >
        <${ThisOrAllChange}
          onClose=${visibilityThisOrAllChange.handleMakeInvisible}
          handleScheduleChange=${handleScheduleChange}
          handleDeleteRepeatActivity=${handleDeleteRepeatActivity}
          isDelete=${isDelete}
          isFirstRepeating=${isFirstRepeating}
          title="ThisOrAllChange"
        >
        </> 
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
