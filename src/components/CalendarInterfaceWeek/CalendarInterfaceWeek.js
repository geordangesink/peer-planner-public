// FIX-BUG: activities sometimes lag behind when switching pages of week
import { weekInterfaceActivitiesToDisplay } from "../../api/CalendarInterface/weekInterface/interfaceActivitiesToDisplay";
import { html } from "htm/react";
import { useEffect, useState } from "react";
import useDate from "../../hooks/useDate";
import useSchedule from "../../hooks/useSchedule";

export default ({
  getGridLocation,
  requestScheduleChange,
  handleMakeCreateVisible,
  setOldActivityData,
  dragPreviewStyle,
  setDragPreviewStyle,
  setIsCreate,
}) => {
  const { currentDate, setDate } = useDate();
  const { currentSchedule } = useSchedule();
  const [activitiesForCurrentWeek, setActivitiesForCurrentWeek] = useState([]);
  const [activitiesMultiday, setActivitiesMultiday] = useState([]);
  const [displayedDates, setDisplayedDates] = useState([]);

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
    const { filteredActivities, multiDayActivities } = weekInterfaceActivitiesToDisplay(
      currentSchedule,
      displayedDates
    );

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
      handleMakeCreateVisible();
    }
  };

  /**
   * DISPLAY SCHEDULE IN INTERFACE
   */

  // helper function to calculate grid position from start and end time
  const calculateGridPosition = (startTime, endTime) => {
    // calculate the day index using the date, not just the time
    const dayIndex = displayedDates.findIndex((d) => d.toDateString() === new Date(startTime).toDateString());

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

    if (dayIndex < 0 || isNaN(startPositionActivity) || isNaN(duration) || duration <= 0) {
      console.error("Invalid grid position values:", {
        dayIndex,
        startPositionActivity,
        duration,
      });
    }

    return { dayIndex, startPositionActivity, duration };
  };

  // handle drag start
  const handleDragStart = (event, activityDetails) => {
    const { startPositionActivity } = calculateGridPosition(activityDetails.startTime, activityDetails.endTime);
    // determine offset for mouse in relation to dragged activity
    // this makes it so the activity drops in the grid that cointains most of its area
    // and NOT where the mouse is
    const { timeIndex, relativeX, columnWidth } = getGridLocation(event);
    const timeIndexOffset = timeIndex - startPositionActivity; // get index of mouse and substract by index of event start (needs to be calculated by events lenght)
    const dayIndexOffsetPx = -((relativeX % columnWidth) - columnWidth / 2); // middle of the row cell is 0, offset to left is + and offset to right - to counteract relative position of activity square

    handleEdit(event, { ...activityDetails, timeIndexOffset });
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

    const { columnWidth, rowHeight, gridContainer, dayIndex, timeIndex } = getGridLocation(
      event,
      event.target.dayIndexOffsetPx
    );
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
      backgroundColor: "rgba(128, 128, 128, 0.6)",
      border: "1px dashed #000",
      display: "block",
      height: `${elementHeight}px`,
      left: `${snapLeft}px`,
      pointerEvents: "none",
      position: "absolute",
      top: `${snapTop}px`,
      width: `${elementWidth}px`,
      zIndex: "1000",
    };
    // set drag preview styles to snap to grid
    if (JSON.stringify(dragPreviewStyle) !== JSON.stringify(newStyle)) {
      setDragPreviewStyle(newStyle);
    }
  };

  return html`
    <div className="calendar-interface-container" onDrag=${handleDrag}>
      <div className="calendar-grid-container">
        <div className="calendar-grid">
          <div className="column-labels">
            <div className="GMT">
              <span>${`GMT\n${new Date().toString().split(" ")[5].split("T")[1]}`}</span>
            </div>
            ${displayedDates.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              const formatter = new Intl.DateTimeFormat(undefined, {
                weekday: "short",
              });

              return html`
                <div key=${`column-label-${index}`} className="column-label">
                  <div className="button-date-container" key=${`button-date-container-${index}`}>
                    <label key=${`button-date-day-${index}`} htmlFor=${`button-date-${index}`}> ${formatter.format(date).toLocaleUpperCase()} </span>
                    <button
                      key=${`button-date-number-${index}`}
                      id=${`button-date-${index}`}
                      className=${`circle-button 
                        ${isCurrentMonth ? "" : "greyed-day"}
                        ${date.toDateString() === new Date(currentDate).toDateString() ? "selected-day" : ""}
                        ${date.toDateString() === new Date().toDateString() ? "today" : ""}`}
                      onClick=${() => handleDayClick(date)}
                    >
                      <h3>${date.getDate()}</h3>
                    </button>
                  </div>
                  ${
                    activitiesMultiday[index]
                      ? activitiesMultiday[index].map((activity, index) => {
                          if (activity === "place-holder") {
                            return html`<div
                              key=${`place-holder-${index}-${index}`}
                              style=${{
                                height: "18px",
                              }}
                            ></div>`;
                          }
                          const { key, date, startTime, endTime, detailsMap } = activity;
                          return html`
                            <div
                              key=${`activity-${index}-${index}`}
                              className="activity-box activity-title-low-height small-text"
                              style=${{
                                height: "18px",
                              }}
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
                                className="activity-content activity-low-heigth"
                                style=${{
                                  backgroundColor: detailsMap.get("color"),
                                }}
                              >
                                <div className="task-activity-title activity-title-low-height small-text">
                                  ${!detailsMap.get("isEvent")
                                    ? html`<input type="checkbox" className="task-checkbox" id=${key} />`
                                    : ""}
                                  <h4>${detailsMap.get("title")}</h4>
                                </div>
                                <p>${detailsMap.get("description")}</p>
                              </div>
                            </div>
                          `;
                        })
                      : ""
                  }
                </div>
              `;
            })}
          </div>
          <div className="hoursContainer">
            <div className="calendar-row-labels">
              ${Array.from({ length: 24 }, (_, index) => {
                // Create a Date object for each hour of the day
                const date = new Date(2023, 0, 1, index); // January 1, 2023, with the given hour

                // Format the time according to the system's locale
                const formattedTime = new Intl.DateTimeFormat(undefined, {
                  hour: "numeric",
                }).format(date);

                return html` <div key=${`row-label-${index}`} className="row-label">${formattedTime}</div> `;
              })}
            </div>
            <div className="grid-and-activities">
              <!-- Empty grid background -->
              ${Array.from(
                { length: 7 },
                (_, dayIndex) => html`
                  <div key=${`day-grid-${dayIndex}`} className="weekdayHours">
                    ${Array.from(
                      { length: 24 },
                      (_, hour) => html` <div key=${`hour-cell-${dayIndex}-${hour}`} className="hour"></div> `
                    )}
                  </div>
                `
              )}

              <div className="scheduleActivities" onDragOver=${handleDragOver} onDrop=${requestScheduleChange}>
                ${activitiesForCurrentWeek.map(({ key, date, startTime, endTime, detailsMap }, index) => {
                  const { dayIndex, startPositionActivity, duration } = calculateGridPosition(startTime, endTime);

                  return html`
                    <div
                      key=${`activity-box-${index}`}
                      className="activity-box"
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
                        className="activity-content"
                        style=${{
                          backgroundColor: detailsMap.get("color"),
                        }}
                      >
                        <div className="task-activity-title">
                          ${!detailsMap.get("isEvent")
                            ? html`<input type="checkbox" className="task-checkbox" id=${key} />`
                            : ""}
                          <h4>${detailsMap.get("title")}</h4>
                          <p>${detailsMap.get("description")}</p>
                        </div>
                        <span>${startTime.toTimeString().slice(0, 5)}-${endTime.toTimeString().slice(0, 5)}</span>
                      </div>
                    </div>
                  `;
                })}
                <div className="drag-preview" style=${dragPreviewStyle}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};
