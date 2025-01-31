// FIX-BUG: activities sometimes lag behind when switching pages of week
import interfaceActivitiesToDisplay from './interfaceActivitiesToDisplay';
import { html } from 'htm/react';
import { useEffect, useState } from 'react';
import useDate from '../../hooks/useDate';
import useSchedule from '../../hooks/useSchedule';

export default ({
  getGridLocation,
  requestScheduleChange,
  handleMakeEditVisible,
  setOldActivityData,
  setIsCreate,
}) => {
  const { currentDate, setDate } = useDate();
  const { currentSchedule } = useSchedule();
  const [dragPreviewStyle, setDragPreviewStyle] = useState({ display: 'none' });
  const [activitiesForCurrentWeek, setActivitiesForCurrentWeek] = useState([]);
  const [activitiesMultiday, setActivitiesMultiday] = useState([]);
  const [displayedDates, setDisplayedDates] = useState([]);

  console.log('rendered CalendarInterfaceWeek');

  // calculate dates to display for currently viewd week
  useEffect(() => {
    let dayOfWeek = currentDate.getDay();
    //dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // only if week starts on monday (without -> sunday)
    const start = new Date(currentDate.toDateString()); // time 00:00
    start.setDate(currentDate.getDate() - dayOfWeek); // set start day of week

    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });

    setDisplayedDates(dates);
  }, [currentDate]);

  // filter schedule for currently displayed week
  useEffect(() => {
    if (!currentSchedule || displayedDates.length === 0) return;
    // array of objects with information about every activity UI box (multi-day, repeating, overlapping from last week ... ect.)
    const { filteredActivities, multiDayActivities } =
      interfaceActivitiesToDisplay(currentSchedule, displayedDates);

    setActivitiesForCurrentWeek(filteredActivities);
    setActivitiesMultiday(multiDayActivities);
  }, [currentSchedule, displayedDates]);

  /**
   * ADJUST CHANGES IN INTERFACE
   */

  // handle day clicks (column labels)
  const handleDayClick = (date) => {
    setDate(date); // set the date to the clicked day
  };

  const handleEdit = (event, activityDetails, isClick = false) => {
    setOldActivityData({
      ...activityDetails,
      ...Object.fromEntries(activityDetails.detailsMap),
    });
    if (isClick) {
      setIsCreate(false);
      handleMakeEditVisible();
    }
  };

  /**
   * DISPLAY SCHEDULE IN INTERFACE
   */

  // helper function to calculate grid position from start and end time
  const calculateGridPosition = (startTime, endTime) => {
    // calculate the day index using the date, not just the time
    const dayIndex = displayedDates.findIndex(
      (d) => d.toDateString() === new Date(startTime).toDateString()
    );

    // calculate start position based on hours and minutes
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    const startPositionActivity = startHour * 4 + startMinutes / 15;

    // calculate end position based on hours and minutes
    // SIDENOTE: for activities that go till the end of the day (00:00 the next day) I made it so it is 23:59, the time will here then be set to 0 and the day can stay as is (this day and not the actually next)
    const endHour =
      endTime.getHours() === 23 && endTime.getMinutes() === 59 // if its end of the day
        ? 24
        : endTime.getHours();
    const endMinutes =
      endTime.getHours() === 23 && endTime.getMinutes() === 59 // if its end of the day
        ? 0
        : endTime.getMinutes();
    const endPosition = endHour * 4 + endMinutes / 15;

    // duration in number of 15-minute slots
    const duration = endPosition - startPositionActivity;

    if (
      dayIndex < 0 ||
      isNaN(startPositionActivity) ||
      isNaN(duration) ||
      duration <= 0
    ) {
      console.error('Invalid grid position values:', {
        dayIndex,
        startPositionActivity,
        duration,
      });
    }

    return { dayIndex, startPositionActivity, duration };
  };

  // handle drag start
  const handleDragStart = (event, activityDetails) => {
    const { startPositionActivity } = calculateGridPosition(
      activityDetails.startTime,
      activityDetails.endTime
    );
    // determine offset for mouse in relation to dragged activity
    // this makes it so the activity drops in the grid that cointains most of its area
    // and NOT where the mouse is
    const { timeIndex, relativeX, columnWidth } = getGridLocation(event);
    const timeIndexOffset = timeIndex - startPositionActivity; // get index of mouse and substract by index of event start (needs to be calculated by events lenght)
    const dayIndexOffsetPx = -((relativeX % columnWidth) - columnWidth / 2); // middle of the row cell is 0, offset to left is + and offset to right - to counteract relative position of activity square

    handleEdit(event, {
      ...activityDetails,
      timeIndexOffset,
      dayIndexOffsetPx,
    });
    // store the offset directly on the event for access in handleDrag
    event.target.timeIndexOffset = timeIndexOffset;
    event.target.dayIndexOffsetPx = dayIndexOffsetPx;
    event.target.draggingElement = event.target;
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };
  // handle drag (show dragged position preview as grey box)
  const handleDrag = (event) => {
    event.preventDefault();

    const { columnWidth, rowHeight, gridContainer, dayIndex, timeIndex } =
      getGridLocation(event, event.target.dayIndexOffsetPx);
    if (!gridContainer) return;

    const draggedElement = event.target.draggingElement;
    if (!draggedElement) return;

    const timeIndexOffset = event.target.timeIndexOffset;

    // get the dragged element’s dimensions
    const elementRect = draggedElement.getBoundingClientRect();
    const elementWidth = elementRect.width;
    const elementHeight = elementRect.height;

    // calculate the snap-to position
    const snapLeft = dayIndex * columnWidth;
    const snapTop = (timeIndex - timeIndexOffset) * rowHeight;

    const newStyle = {
      backgroundColor: 'rgba(128, 128, 128, 0.6)',
      border: '1px dashed #000',
      display: 'block',
      height: `${elementHeight}px`,
      left: `${snapLeft}px`,
      pointerEvents: 'none',
      position: 'absolute',
      top: `${snapTop}px`,
      width: `${elementWidth}px`,
      zIndex: '1000',
    };
    // set drag preview styles to snap to grid
    if (JSON.stringify(dragPreviewStyle) !== JSON.stringify(newStyle)) {
      setDragPreviewStyle(newStyle);
    }
  };

  return html`
    <div className="overflow-hidden" onDrag=${handleDrag}>
      <div className="relative grid h-full overflow-auto">
        <div className="flex flex-col h-full w-full">
          <div
            className="sticky top-0 flex border-b-[1px] border-[rgba(255,255,255,0.4)] bg-[#000000] z-[8]"
          >
            <div
              className="sticky top-0 left-0 flex h-full w-[48px] pr-[20px] items-center text-[0.6rem] text-[rgb(128,128,128)] bg-[#000000] border-r-[1px] border-[rgba(255,255,255,0.4)] z-[5000]"
            >
              <span
                >${`GMT\n${new Date().toString().split(' ')[5].split('T')[1]}`}</span
              >
            </div>
            <!-- Column Labels -->
            ${displayedDates.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              const formatter = new Intl.DateTimeFormat(undefined, {
                weekday: 'short',
              });

              return html`
                <div key=${`column-label-${index}`} className="relative top-0 flex flex-col items-center justify-start w-[calc(100%/7)] min-w-[100px] border-r-[1px] border-[rgba(128,128,128,0.4)] last:border-r-0 bg-[#000000] z-[8]">
                  <div className="flex items-center my-[2px]" key=${`button-date-container-${index}`}>
                    <label className="mr-[5px]" key=${`button-date-day-${index}`} htmlFor=${`button-date-${index}`}> ${formatter.format(date).toLocaleUpperCase()} </span>
                    <button
                      key=${`button-date-number-${index}`}
                      id=${`button-date-${index}`}
                      className=${`h-[30px] w-[30px] m-1.25 rounded-full mr-[5px] hover:bg-hoverButton
                        ${isCurrentMonth ? '' : 'text-gray-500'}
                        ${date.toDateString() === new Date(currentDate).toDateString() ? 'bg-[rgb(39,39,39)] border-[1px] border-black [border-style:inset]' : ''}
                        ${date.toDateString() === new Date().toDateString() ? 'bg-gray-800' : ''}`}
                      onClick=${() => handleDayClick(date)}
                    >
                      <h3 className="text-[1.3rem]">${date.getDate()}</h3>
                    </button>
                  </div>
                  <!-- Multiday Activities -->
                  ${
                    activitiesMultiday[index]
                      ? activitiesMultiday[index].map((activity, index) => {
                          if (activity === 'place-holder') {
                            return html`<div
                              key=${`place-holder-${index}-${index}`}
                              className="h-[18px] w-full"
                            ></div>`;
                          }
                          const { key, date, startTime, endTime, detailsMap } =
                            activity;
                          return html`
                            <div
                              key=${`activity-${index}-${index}`}
                              className="relative w-full overflow-hidden rounded-[5px] cursor-pointer z-[3] activity-title-low-height my-[2px]"
                              className="h-[18px] w-full"
                              onClick=${(e) =>
                                handleEdit(
                                  e,
                                  {
                                    key,
                                    date,
                                    startTime,
                                    endTime,
                                    detailsMap,
                                  },
                                  true
                                )}
                            >
                              <div
                                className="flex justify-between flex-col p-[5px] rounded-[5px] overflow-hidden h-full w-[calc(100%-5px)] ml-[5px] text-left opacity-[0.9] z-[3] px-[5px] m-0"
                                style=${{
                                  backgroundColor: detailsMap.get('color'),
                                }}
                              >
                                <div
                                  className="task-activity-title flex flex-col activity-title-low-height"
                                >
                                  ${!detailsMap.get('isEvent')
                                    ? html`<input
                                        type="checkbox"
                                        className="task-checkbox mr-[5px]"
                                        id=${key}
                                      />`
                                    : ''}
                                  <h4
                                    className="m-0 z-[3] whitespace-nowrap overflow-hidden truncate w-full text-[0.7rem]"
                                  >
                                    ${detailsMap.get('title')}
                                  </h4>
                                </div>
                                <p
                                  className="m-0 text-[0.6rem] z-[3] whitespace-nowrap overflow-hidden truncate"
                                >
                                  ${detailsMap.get('description')}
                                </p>
                              </div>
                            </div>
                          `;
                        })
                      : ''
                  }
                </div>
              `;
            })}
          </div>
          <div className="flex flex-row">
            <div
              className="sticky left-0 h-full text-[0.6rem] text-[rgb(128,128,128)] bg-[#000000] z-[5]"
            >
              <!-- Row Labels -->
              ${Array.from({ length: 24 }, (_, index) => {
                // Create a Date object for each hour of the day
                const date = new Date(2023, 0, 1, index); // January 1, 2023, with the given hour

                // Format the time according to the system's locale
                const formattedTime = new Intl.DateTimeFormat(undefined, {
                  hour: 'numeric',
                }).format(date);

                return html`
                  <div
                    key=${`row-label-${index}`}
                    className="h-[50px] w-[48px] m-0 p-0 pr-[10px] border-b-[1px] border-r-[1px] border-[rgba(255,255,255,0.4)] last:border-b-0 text-center"
                    style=${{ gridTemplateRows: 'repeat(24, 1fr)' }}
                  >
                    ${formattedTime}
                  </div>
                `;
              })}
            </div>
            <div className="flex w-full flex-row">
              <!-- Empty grid background -->
              ${Array.from(
                { length: 7 },
                (_, dayIndex) => html`
                  <div
                    key=${`day-grid-${dayIndex}`}
                    className="w-[calc(100%/7)] min-w-[100px] relative overflow-hidden"
                  >
                    ${Array.from(
                      { length: 24 },
                      (_, hour) => html`
                        <div
                          key=${`hour-cell-${dayIndex}-${hour}`}
                          className=${`relative h-[50px] bg-black border-b border-b-[rgba(128,128,128,0.4)] border-r border-r-[rgba(128,128,128,0.4)] text-center ${hour === 23 && 'border-b-0'} ${dayIndex === 6 && 'border-r-0'}`}
                        ></div>
                      `
                    )}
                  </div>
                `
              )}

              <div
                id="scheduleActivities"
                className="absolute grid overflow-hidden h-[1200px] w-[calc(100%-48px)] min-w-[700px] grid-cols-7 grid-rows-[repeat(96,_12.5px)] z-[3]"
                onDragOver=${handleDragOver}
                onDrop=${(e) => (
                  setDragPreviewStyle({ display: 'none' }),
                  requestScheduleChange(e)
                )}
              >
                ${activitiesForCurrentWeek.map(
                  ({ key, date, startTime, endTime, detailsMap }, index) => {
                    const { dayIndex, startPositionActivity, duration } =
                      calculateGridPosition(startTime, endTime);

                    return html`
                      <div
                        key=${`activity-box-${index}`}
                        className="relative w-full overflow-hidden rounded-[5px] cursor-pointer z-[3]"
                        style=${{
                          gridColumnStart: dayIndex + 1,
                          gridColumnEnd: dayIndex + 2,
                          gridRowStart: startPositionActivity + 1, // Adjust to match your grid
                          gridRowEnd: `span ${duration}`,
                        }}
                        draggable="true"
                        onDragStart=${(e) =>
                          handleDragStart(e, {
                            key,
                            date,
                            startTime,
                            endTime,
                            detailsMap,
                          })}
                        onClick=${(e) =>
                          handleEdit(
                            e,
                            {
                              key,
                              date,
                              startTime,
                              endTime,
                              detailsMap,
                            },
                            true
                          )}
                      >
                        <div
                          className="flex justify-between flex-col p-[5px] rounded-[5px] overflow-hidden h-full w-[calc(100%-5px)] ml-[5px] text-left opacity-[0.9] z-[3]"
                          style=${{
                            backgroundColor: detailsMap.get('color'),
                          }}
                        >
                          <div className="task-activity-title flex flex-col">
                            ${!detailsMap.get('isEvent')
                              ? html`<input
                                  type="checkbox"
                                  className="task-checkbox mr-[5px]"
                                  id=${key}
                                />`
                              : ''}
                            <h4
                              className="m-0 text-[0.8rem] z-[3] whitespace-nowrap overflow-hidden truncate w-full"
                            >
                              ${detailsMap.get('title')}
                            </h4>
                            <p
                              className="m-0 text-[0.6rem] z-[3] whitespace-nowrap overflow-hidden truncate"
                            >
                              ${detailsMap.get('description')}
                            </p>
                          </div>
                          <span className="text-[0.7rem] w-full text-right"
                            >${startTime.toTimeString().slice(0, 5)}-${endTime
                              .toTimeString()
                              .slice(0, 5)}</span
                          >
                        </div>
                      </div>
                    `;
                  }
                )}
                <div
                  className="hidden absolute bg-[rgba(128,128,128,0.8)] border border-dashed border-black pointer-events-none z-[1000]"
                  style=${dragPreviewStyle}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
