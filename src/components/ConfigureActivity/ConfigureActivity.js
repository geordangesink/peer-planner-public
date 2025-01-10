import { html } from "htm/react";
import { useRef, useMemo } from "react";
import useDate from "../../hooks/useDate";
import useSchedule from "../../hooks/useSchedule";
import useNewActivityMap from "../../hooks/useNewActivityMap";
import useIsVisible from "../../hooks/useIsVisible";
import CustomRepeat from "../CustomRepeat/CustomRepeat";

export default ({ onClose, requestScheduleChange, requestDeleteActivity, oldActivityData, isVisible, isCreate }) => {
  const { currentDate } = useDate();
  const { sharedDbObject, roomIdRef, currentSchedule, setSchedule } = useSchedule();
  const {
    isEvent,
    setIsEvent,
    titleRef,
    fromDateRef,
    fromTimeRef,
    untilDateRef,
    untilTimeRef,
    descriptionRef,
    repeatRef,
    customRepeatRef,
    colorRef,
    notificationRef,
    getActivityObject,
  } = useNewActivityMap();
  const isVisibleCustomRep = useIsVisible();
  const popupContentRef = useRef(null);
  const weekdayStr = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(currentDate),
    [currentDate]
  );

  const editOpts = useMemo(() => {
    if (!oldActivityData || isCreate) return {};
    customRepeatRef.current = oldActivityData.customRepeat;
    return {
      ...oldActivityData,
      fromDate: formatDate(oldActivityData.from),
      fromTime: formatTime(oldActivityData.from),
      untilDate: formatDate(oldActivityData.until),
      untilTime: formatTime(oldActivityData.until),
    };
  }, [oldActivityData, isCreate]);

  const onDelete = () => {
    requestDeleteActivity();
    onClose();
  };

  const onSave = () => {
    const newSchedule = getActivityObject(oldActivityData && oldActivityData.key);
    const updatedSchedule = new Map(currentSchedule);
    if (!isCreate) requestScheduleChange(undefined, newSchedule);
    else {
      for (const [key, value] of newSchedule) {
        const existing = updatedSchedule.get(key) || new Map();
        updatedSchedule.set(key, new Map([...existing, ...value]));
      }
      setSchedule(updatedSchedule);
    }
    onClose();
  };

  const handleDatetimeChange = (from) => {
    const fromDateTime = new Date(fromDateRef.current.value + "T" + fromTimeRef.current.value);
    const untilDateTime = new Date(untilDateRef.current.value + "T" + untilTimeRef.current.value);

    if (from && fromDateTime >= untilDateTime) {
      untilDateTime.setTime(fromDateTime.getTime() + 3600000);
      untilDateRef.current.value = formatDate(untilDateTime);
      untilTimeRef.current.value = formatTime(untilDateTime);
    } else if (!from && fromDateTime >= untilDateTime) {
      fromDateTime.setTime(untilDateTime.getTime() - 3600000);
      fromDateRef.current.value = formatDate(fromDateTime);
      fromTimeRef.current.value = formatTime(fromDateTime);
    }
  };

  const handleOverlayClick = (e) => {
    if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleCustomRepeatClick = () => {
    if (repeatRef.current.value === "custom") {
      isVisibleCustomRep.handleMakeVisible();
    }
  };

  if (!isVisible) return null;

  return html`
    <div className="popup-overlay" onClick=${handleOverlayClick}>
      <div className="popup-content" ref=${popupContentRef}>
        <button className="popup-close" onClick=${onClose}>x</button>
        <h3>${isCreate ? "Create Activity:" : "Edit Activity:"}</h3>
        <div className="button-container">
          ${["Event", "Task"].map(
            (type) => html`
              <button
                key=${`event-task-${type}`}
                className=${`button-square ${isEvent === (type === "Event") ? "active" : ""}`}
                onClick=${() => setIsEvent(type === "Event")}
              >
                ${type}
              </button>
            `
          )}
        </div>
        <form>
          <input
            id="activity-title"
            type="text"
            placeholder="Add Title"
            ref=${titleRef}
            defaultValue=${editOpts.title !== "(No Title)" ? editOpts.title : ""}
          />
          <div className="create-date-time">
            ${["From", "Until"].map(
              (field, idx) => html`
                <label key=${`label-${field}`} htmlFor="activity-${field.toLowerCase()}-datetime"> ${field}: </label>
                <input
                  key=${`date-${field}`}
                  id="activity-${field.toLowerCase()}-datetime"
                  type="date"
                  defaultValue=${editOpts[`${field.toLowerCase()}Date`] ||
                  (field === "From" ? formatDate(currentDate) : formatDate(new Date(currentDate).getTime() + 3600000))}
                  ref=${idx ? untilDateRef : fromDateRef}
                  onChange=${() => handleDatetimeChange(!idx)}
                />
                <select
                  key=${`time-${field}`}
                  id="${field.toLowerCase()}-time"
                  defaultValue=${editOpts[`${field.toLowerCase()}Time`] ||
                  (field === "From" ? formatTime(currentDate) : formatTime(new Date(currentDate).getTime() + 3600000))}
                  ref=${idx ? untilTimeRef : fromTimeRef}
                  onChange=${() => handleDatetimeChange(!idx)}
                >
                  ${Array.from({ length: 96 }, (_, i) => {
                    const hour = String(Math.floor(i / 4)).padStart(2, "0");
                    const minute = ["00", "15", "30", "45"][i % 4];
                    return html`
                      <option key=${`time-${field}-${hour}-${minute}`} value=${`${hour}:${minute}`}>
                        ${hour}:${minute}
                      </option>
                    `;
                  })}
                </select>
                <br />
              `
            )}
          </div>
          <textarea
            id="activity-description"
            placeholder="Description"
            ref=${descriptionRef}
            defaultValue=${editOpts.description}
          />
          <select
            id="repeat"
            defaultValue=${editOpts.repeat || "no-repeat"}
            onChange=${handleCustomRepeatClick}
            ref=${repeatRef}
            ${editOpts.repeat && editOpts.repeat !== "no-repeat" && `disabled`}
          >
            ${editOpts.repeat && editOpts.repeat !== "no-repeat"
              ? html`<option key=${`repeat-${editOpts.repeat}`} value=${editOpts.repeat}>${editOpts.repeat}</option>`
              : [
                  { value: "no-repeat", label: "Doesn't repeat" },
                  { value: "daily", label: "Daily" },
                  { value: "weekdays", label: "Weekdays" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: `${currentDate.getDate()}. day every Month` },
                  {
                    value: "monthlyNum",
                    label: `${Math.ceil(currentDate.getDate() / 7)}. ${weekdayStr} every Month`,
                  },
                  { value: "annually", label: "Annually" },
                  { value: "custom", label: "Custom..." },
                ].map(
                  (option) => html`
                    <option key=${`repeat-${option.value}`} value=${option.value}>${option.label}</option>
                  `
                )}
          </select>
          <input
            type="color"
            defaultValue=${editOpts.color ||
            (sharedDbObject[roomIdRef.current] ? sharedDbObject[roomIdRef.current].info.color : "#7B0323")}
            ref=${colorRef}
          />
          <label htmlFor="activity-reminder">Remind me: </label>
          <select id="activity-reminder" defaultValue=${editOpts.notification || "30m"} ref=${notificationRef}>
            <option value="5m">5 minutes before</option>
            <option value="10m">10 minutes before</option>
            <option value="15m">15 minutes before</option>
            <option value="30m">30 minutes before</option>
            <option value="1h">1 hour before</option>
            <option value="1d">1 day before</option>
          </select>
        </form>
        <button className="button-square button-save" onClick=${onSave}>Save</button>
        ${!isCreate && html`<button className="button-square button-save" onClick=${onDelete}>Delete</button>`}
        <${CustomRepeat}
          isVisibleInner=${isVisibleCustomRep.isVisible}
          onCancel=${() => {
            customRepeatRef.current === "" && (repeatRef.current.value = "no-repeat");
            isVisibleCustomRep.handleMakeInvisible();
          }}
          onSave=${(customRepeat) => {
            customRepeatRef.current = customRepeat;
            isVisibleCustomRep.handleMakeInvisible();
          }}
          title="Custom Repeat"
        />
      </div>
    </div>
  `;
};

function formatDate(date) {
  const adjustedDate = new Date(date);
  const year = adjustedDate.getFullYear();
  const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
  const day = String(adjustedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const adjustedDate = new Date(date);
  const hour = String(adjustedDate.getHours()).padStart(2, "0");
  const minute = Math.floor(adjustedDate.getMinutes() / 15) * 15;

  return `${hour}:${String(minute).padStart(2, "0")}`;
}
