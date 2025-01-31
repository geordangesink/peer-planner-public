import { html } from 'htm/react';
import { useMemo } from 'react';
import { formatDate, formatTime } from './formatDateTime';
import useActivityState from './useActivityState';
import useDate from '../../hooks/useDate';
import useSchedule from '../../hooks/useSchedule';

export default ({
  isCreate,
  oldActivityData,
  titleRef,
  fromDateRef,
  fromTimeRef,
  untilDateRef,
  untilTimeRef,
  descriptionRef,
  repeatRef,
  colorRef,
  notificationRef,
  isVisibleCustomRep,
}) => {
  const { editOpts } = useActivityState(oldActivityData, isCreate);
  const { sharedDbObject, roomIdRef } = useSchedule();
  const { currentDate } = useDate();

  const weekdayStr = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(
        currentDate
      ),
    [currentDate]
  );

  const handleCustomRepeatClick = () => {
    if (repeatRef.current.value === 'custom') {
      isVisibleCustomRep.handleMakeVisible();
    }
  };

  const handleDatetimeChange = (from) => {
    const fromDateTime = new Date(
      fromDateRef.current.value + 'T' + fromTimeRef.current.value
    );
    const untilDateTime = new Date(
      untilDateRef.current.value + 'T' + untilTimeRef.current.value
    );

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

  return html`
    <form className="space-y-1 space-x-1">
      <input
        className="w-full h-[40px] text-[20px]"
        type="text"
        placeholder="Add Title"
        ref=${titleRef}
        defaultValue=${editOpts.title !== '(No Title)' ? editOpts.title : ''}
      />
      <div className="create-date-time">
        ${['From', 'Until'].map(
          (field, idx) => html`
            <label
              key=${`label-${field}`}
              htmlFor="activity-${field.toLowerCase()}-datetime"
            >
              ${field}:
            </label>
            <input
              className="mr-1 mt-2 mb-2"
              key=${`date-${field}`}
              id="activity-${field.toLowerCase()}-datetime"
              type="date"
              defaultValue=${editOpts[`${field.toLowerCase()}Date`] ||
              (field === 'From'
                ? formatDate(currentDate)
                : formatDate(new Date(currentDate).getTime() + 3600000))}
              ref=${idx ? untilDateRef : fromDateRef}
              onChange=${() => handleDatetimeChange(!idx)}
            />
            <select
              key=${`time-${field}`}
              id="${field.toLowerCase()}-time"
              defaultValue=${editOpts[`${field.toLowerCase()}Time`] ||
              (field === 'From'
                ? formatTime(currentDate)
                : formatTime(new Date(currentDate).getTime() + 3600000))}
              ref=${idx ? untilTimeRef : fromTimeRef}
              onChange=${() => handleDatetimeChange(!idx)}
            >
              ${Array.from({ length: 96 }, (_, i) => {
                const hour = String(Math.floor(i / 4)).padStart(2, '0');
                const minute = ['00', '15', '30', '45'][i % 4];
                return html`
                  <option
                    key=${`time-${field}-${hour}-${minute}`}
                    value=${`${hour}:${minute}`}
                  >
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
        className="resize-none w-full"
        placeholder="Description"
        ref=${descriptionRef}
        defaultValue=${editOpts.description}
      />
      <select
        id="repeat"
        defaultValue=${editOpts.repeat || 'no-repeat'}
        onChange=${handleCustomRepeatClick}
        ref=${repeatRef}
        ${editOpts.repeat && editOpts.repeat !== 'no-repeat' && `disabled`}
      >
        ${editOpts.repeat && editOpts.repeat !== 'no-repeat'
          ? html`<option
              key=${`repeat-${editOpts.repeat}`}
              value=${editOpts.repeat}
            >
              ${editOpts.repeat}
            </option>`
          : [
              { value: 'no-repeat', label: "Doesn't repeat" },
              { value: 'daily', label: 'Daily' },
              { value: 'weekdays', label: 'Weekdays' },
              { value: 'weekly', label: 'Weekly' },
              {
                value: 'monthly',
                label: `${currentDate.getDate()}. day every Month`,
              },
              {
                value: 'monthlyNum',
                label: `${Math.ceil(currentDate.getDate() / 7)}. ${weekdayStr} every Month`,
              },
              { value: 'annually', label: 'Annually' },
              { value: 'custom', label: 'Custom...' },
            ].map(
              (option) => html`
                <option key=${`repeat-${option.value}`} value=${option.value}>
                  ${option.label}
                </option>
              `
            )}
      </select>
      <input
        type="color"
        defaultValue=${editOpts.color ||
        (sharedDbObject[roomIdRef.current]
          ? sharedDbObject[roomIdRef.current].info.color
          : '#7B0323')}
        ref=${colorRef}
      />
      <label htmlFor="activity-reminder">Remind me: </label>
      <select
        id="activity-reminder"
        defaultValue=${editOpts.notification || '30m'}
        ref=${notificationRef}
      >
        <option value="5m">5 minutes before</option>
        <option value="10m">10 minutes before</option>
        <option value="15m">15 minutes before</option>
        <option value="30m">30 minutes before</option>
        <option value="1h">1 hour before</option>
        <option value="1d">1 day before</option>
      </select>
    </form>
  `;
};
