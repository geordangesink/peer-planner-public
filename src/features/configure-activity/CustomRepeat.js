import { html } from 'htm/react';
import { useState, useEffect, useRef } from 'react';
import PopupWindow from '../../components/PopupWindow';
import useDate from '../../hooks/useDate';

// TODO: make it less hacky lol

/**
 * Handles the logic for saving the customized repeating pattern
 * and displays the UI of the respective window.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.isVisible - Indicates if the UI window for customizing the repeating pattern is visible.
 * @param {Function} props.onCancel - Callback function to handle cancellation of the action.
 * @param {Function} props.onSave - Callback function to handle saving the repeating pattern.
 */
export default ({ isVisible, onCancel, onSave }) => {
  const { currentDate } = useDate();

  // saved settings
  const [repeatEveryNum, setRepeatEveryNum] = useState(1);
  const [selectedTimeframeSaved, setSelectedTimeframeSaved] = useState('week');
  const [activeWeekdaysSaved, setActiveWeekdaysSaved] = useState(
    new Array(7).fill(false)
  );
  const [onEveryMonthSaved, setOnEveryMonthSaved] = useState('monthly');
  const [endsSaved, setEndsSaved] = useState('never');
  const [endDateSaved, setEndDateSaved] = useState(
    new Date(
      currentDate.getFullYear() + 1,
      currentDate.getMonth(),
      currentDate.getDate()
    )
  );
  const [endRecurrenceSaved, setEndRecurrenceSaved] = useState(12);

  // current settings
  const repeatEveryNumRef = useRef(repeatEveryNum);
  const [selectedTimeframe, setSelectedTimeframe] = useState(
    selectedTimeframeSaved
  );
  const [activeWeekdays, setActiveWeekdays] = useState(activeWeekdaysSaved);
  const [onEveryMonth, setOnEveryMonth] = useState(onEveryMonthSaved);
  const [ends, setEnds] = useState(endsSaved);
  const [endDate, setEndDate] = useState(endDateSaved);
  const [endRecurrence, setEndRecurrence] = useState(endRecurrenceSaved);

  const repeatEndsRef = useRef(); ///// ADD END DATE
  const popupContentRef = useRef(null); // ref for closing when click outside interface

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // weekdays for weekday selecter
  // prepare for month repeat selection render and displayed strings
  const testNextWeekdayDate = new Date(currentDate);
  const testNextDay = new Date(currentDate);
  testNextWeekdayDate.setDate(currentDate.getDate() + 7);
  testNextDay.setDate(currentDate.getDate() + 1);
  const weekdayAbbreviations = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // update default selected weekday based on currentDate
  useEffect(() => {
    const currentDayIndex = currentDate.getDay();
    const newActiveWeekdays = new Array(7).fill(false);
    newActiveWeekdays[currentDayIndex] = true;
    setActiveWeekdays(newActiveWeekdays);
    setActiveWeekdaysSaved(newActiveWeekdays);
  }, [currentDate]);

  // handle clicking weekdays
  const handleWeekdayClick = (index) => {
    setActiveWeekdays((prev) => {
      const newActiveWeekdays = [...prev];
      newActiveWeekdays[index] = !newActiveWeekdays[index];
      // Ensure at least one day is active
      if (newActiveWeekdays.every((active) => !active)) {
        newActiveWeekdays[index] = true;
      }
      return newActiveWeekdays;
    });
  };

  // handle end setting change
  const handleEndsChange = (e) => {
    setEnds(e.target.value);
  };

  // handle end date change
  const handleEndDateChange = (e) => {
    setEndDate(new Date(e.target.value));
  };

  // handle end recurrence change
  const handleEndRecurrenceChange = (e) => {
    setEndRecurrence(e.target.value);
  };

  // handle save and create object that will be assigned to activity map customRpeat
  const handleSaveRepeat = () => {
    const repeatEveryN =
      repeatEveryNumRef.current.value < 1 // if value is 0, set to one
        ? 1
        : repeatEveryNumRef.current.value;

    // save settings
    setRepeatEveryNum(repeatEveryN);
    setSelectedTimeframeSaved(selectedTimeframe);
    setActiveWeekdaysSaved(activeWeekdays);
    setOnEveryMonthSaved(onEveryMonth);
    setEndsSaved(ends);
    setEndDateSaved(endDate);
    setEndRecurrenceSaved(endRecurrence);

    // init variables
    let activeIndices = 'day';
    let timeframe = selectedTimeframe;
    let monthSpec = '';
    let endSpec = '';
    // save current settings as objects
    if (selectedTimeframe === 'week') {
      activeIndices = activeWeekdays
        .map((active, index) => (active ? index : -1))
        .filter((index) => index !== -1);
    } else if (selectedTimeframe === 'month') {
      monthSpec = onEveryMonth;

      if (onEveryMonth === 'monthlyNum' || onEveryMonth === 'monthlyLast') {
        activeIndices = activeWeekdays
          .map((active, index) => (active ? index : -1))
          .filter((index) => index !== -1);
      }
    } else if (selectedTimeframe === 'year') {
      activeIndices = 'year';
    }
    // save end settings
    if (ends === 'date') {
      endSpec = endDate;
    } else if (ends === 'recurrence') {
      endSpec = endRecurrence;
    }

    return {
      everyNum: repeatEveryN,
      everyTimeframe: timeframe,
      onEvery: activeIndices,
      monthSpec,
      ends: { type: ends, spec: endSpec },
    };
  };

  const handleCancel = (e) => {
    e.stopPropagation(); // dont close CreateActivity;
    onCancel(); // close
    // set all current settings back to the last saved states
    setSelectedTimeframe(selectedTimeframeSaved);
    setActiveWeekdays(activeWeekdaysSaved);
    setOnEveryMonth(onEveryMonthSaved);
    setEnds(endsSaved);
    setEndDate(endDateSaved);
    setEndRecurrence(endRecurrenceSaved);
  };

  return html`
    <${PopupWindow}
      isVisible=${isVisible}
      onClose=${handleCancel}
      widthPx=${400}
      heightPx=${500}
    >
          <h3 className="w-full ml-[30px]">Custom recurrence:</h3>

          <form className="repeat-every my-4">
            <span>Repeat every:</span>
            <input
              className="w-[60px]"
              id="recurrence-number"
              type="number"
              min="1"
              defaultValue=${repeatEveryNum}
              ref=${repeatEveryNumRef}
              onKeyDown=${(e) => {
                if (
                  // only allow integer inputs. no 0 if it is the only int
                  ['-', '+', 'e', 'E', ',', '.'].includes(e.key) ||
                  (e.target.value < 1 && e.key == 0)
                ) {
                  e.preventDefault();
                }
              }}
            />

            <select
              id="repeat-timeframe"
              defaultValue=${selectedTimeframe}
              onChange=${(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="day">day</option>
              <option value="week">week</option>
              <option value="month">month</option>
              <option value="year">year</option>
            </select>
          </form>
          ${
            selectedTimeframe === 'month' // THIS IS COPIED FROM CreateActivity
              ? html`
                  <form className="repeat-on my-4">
                    <span>Repeat on</span>
                    <select
                      id="repeat"
                      defaultValue=${onEveryMonth}
                      onChange=${(e) => setOnEveryMonth(e.target.value)}
                    >
                      <option value="monthly">
                        ${currentDate.getDate()}. day every Month
                      </option>
                      <option value="monthlyNum">
                        Week including ${Math.ceil(currentDate.getDate() / 7)}.
                        ${weekdayAbbreviations[currentDate.getDay()]} of Month
                      </option>
                      ${testNextWeekdayDate.getMonth() !==
                      currentDate.getMonth()
                        ? html`<option value="monthlyLast">
                            Week including last
                            ${weekdayAbbreviations[currentDate.getDay()]} of
                            Month
                          </option>`
                        : ''}
                      ${testNextDay.getMonth() !== currentDate.getMonth()
                        ? html`<option value="monthlyLastDay">
                            last day of Month
                          </option>`
                        : ''}
                    </select>
                  </form>
                `
              : null
          }
          ${
            selectedTimeframe === 'week' ||
            (selectedTimeframe === 'month' && onEveryMonth === 'monthlyLast') ||
            (selectedTimeframe === 'month' && onEveryMonth === 'monthlyNum')
              ? html`
                  <div className="repeat-on-weekday my-4">
                    <span>Repeat on:</span>

                    <div className="flex flex-row">
                      ${weekdays.map(
                        (day, index) => html`
                          <button
                            key=${index + 'select-weekday'}
                            className=${`h-[30px] w-[30px] m-1.25 rounded-full ${activeWeekdays[index] ? 'bg-[rgb(39,39,39)] border-[1px] border-black [border-style:inset]' : ''}`}
                            onClick=${(e) => {
                              e.preventDefault();
                              handleWeekdayClick(index);
                            }}
                          >
                            <span>${day}</span>
                          </button>
                        `
                      )}
                    </div>
                  </div>
                `
              : null
          }

          <div className="w-full pl-[40px] my-4">
            <span>Ends:</span>
            <form className="mt-[10px] w-full flex flex-col" action="">
              <div>
                <input
                  type="radio"
                  id="custom-repeat-never-end"
                  name="repeat-activity-ends"
                  value="never"
                  checked=${ends === 'never'}
                  onChange=${handleEndsChange}
                />
                <label htmlFor="custom-repeat-never-end">Never</label>
              </div>

              <div>
                <input
                  type="radio"
                  id="custom-repeat-end-date"
                  name="repeat-activity-ends"
                  value="date"
                  checked=${ends === 'date'}
                  onChange=${handleEndsChange}
                />
                <label htmlFor="custom-repeat-end-date">On</label>
                <input
                  type="date"
                  onChange=${handleEndDateChange}
                  defaultValue=${
                    endDate
                      .toLocaleString('sv-SE', {
                        timeZoneName: 'short',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                      .split(' ')[0]
                  }
                />
              </div>

              <div>
                <input
                  type="radio"
                  id="custom-repeat-recurrency-end"
                  name="repeat-activity-ends"
                  value="recurrence"
                  checked=${ends === 'recurrence'}
                  onChange=${handleEndsChange}
                />
                <label htmlFor="custom-repeat-recurrency-end">After</label>

                <input
                  className="w-[60px]"
                  id="recurrence-number"
                  type="number"
                  min="1"
                  defaultValue=${endRecurrence}
                  onChange=${handleEndRecurrenceChange}
                  onKeyDown=${(e) => {
                    if (
                      // only allow integer inputs. no 0 if it is the only int
                      ['-', '+', 'e', 'E', ',', '.'].includes(e.key) ||
                      (e.target.value < 1 && e.key == 0)
                    ) {
                      e.preventDefault();
                    }
                  }}
                />
                <span>recurrences</span>
              </div>
            </form>
          </div>
          <button
            className="h-[30px] w-[80px] border border-[rgba(128,128,128,0.4)] m-2.5"
            onClick=${(e) => {
              e.preventDefault();
              onSave(handleSaveRepeat());
            }}
          >
            Save
          </button>
    </${PopupWindow}>
  `;
};
