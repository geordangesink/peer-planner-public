// Logic for displaying the activities on week layout according to saved details

/**
 * - takes current scheduele and dates at display -> returns Arrays of activity boxes
 * @param {Map} currentSchedule - Map of current Schedule
 * @param {Array} displayedDates - array of currently displayed Dates (as Date object)
 * @returns {{
 *   filteredActivities: Array<{ key: string, date: Date, startTime: Date, endTime: Date, detailsMap: Map<any, any> }>,
 *   multiDayActivities: Array<Array<{ key: string, date: Date, startTime: Date, endTime: Date, detailsMap: Map<any, any> }>>
 * }} - nested Array within multiDayActivitues are indexed for each day of the week
 *
 * @description
 * The `detailsMap` is a `Map<string, value>` with the following possible key-value pairs:
 *
 * - `"from"`: `Date` - The start date and time.
 * - `"until"`: `Date` - The end date and time.
 * - `"dateExceptions"`: `Array<any>` - A list of date exceptions (can be an empty array).
 * - `"groupKey"`: `null` - Reserved for future grouping logic.
 * - `"isEvent"`: `boolean` - Whether the activity is an event.
 * - `"title"`: `string` - The event title (default: `"(No Title)"`).
 * - `"description"`: `string` - The event description.
 * - `"complete"`: `null` - Reserved for tracking completion.
 * - `"notification"`: `string` - Notification time (e.g., `"30m"` for 30 minutes before).
 * - `"repeat"`: `string` - Repeat rule (e.g., `"no-repeat"`).
 * - `"endRepeat"`: `string` - When the repeat rule ends (e.g., `"never"`).
 * - `"customRepeat"`: `string` - Custom repeat settings.
 * - `"color"`: `string` - Color code for the activity (e.g., `"#7b0323"`).
 */

export default function (currentSchedule, displayedDates) {
  // initialize array as [key, value] for all activities
  const allActivities = Array.from(currentSchedule.entries());

  // set up repeating activity frequencies
  const repeatingFrequencyArr = [
    'daily',
    'weekdays',
    'weekly',
    'monthly',
    'monthlyNum',
    'monthlyLast',
    'monthlyLastDay',
    'annually',
    'custom',
  ];

  // function to push repeating events to allActivities Array as individualy displayed activities
  const pushRepeatingToAllActivities = (frequency) => {
    if (!currentSchedule.has(frequency)) return;
    // turn into [date, activity] for every activity in frequncy (add date)
    currentSchedule
      .get(frequency)
      .entries()
      .forEach(([key, activityMapSaved]) => {
        // for each entry in frequency

        const exceptions = [...activityMapSaved.get('dateExceptions')]; // get exceptions
        const activityFromDate = new Date(activityMapSaved.get('from'));
        const customDetails = activityMapSaved.get('customRepeat'); // details of custom repeat, saved as object
        const endRepeat = activityMapSaved.get('endRepeat');
        let datesToAdd = displayedDates;

        // switch cases for every repeating frequency (filter datesToAdd and chekOverlap)
        switch (frequency) {
          case 'daily':
            // add last day of week before in case of overlap (running over midnight)
            const lastDayLastWeek = new Date(displayedDates[0]);
            lastDayLastWeek.setDate(lastDayLastWeek.getDate() - 1);

            datesToAdd = datesToAdd.map((date) => {
              const day = new Date(date);
              day.setHours(
                activityFromDate.getHours(),
                activityFromDate.getMinutes()
              );

              return day;
            });
            datesToAdd.push(lastDayLastWeek);
            break;

          case 'weekdays':
            datesToAdd = datesToAdd.filter(
              (date) =>
                date.getDay() !== 0 && //sunday
                date.getDay() !== 6 //saturday
            );

            break;

          case 'weekly':
            // filter this week
            datesToAdd = datesToAdd.filter(
              (date) => date.getDay() === activityFromDate.getDay()
            );
            // add last week
            const prevWeekDay = new Date(displayedDates[0]);
            prevWeekDay.setDate(prevWeekDay.getDate() - 7);
            // add next week
            const nextWeekDay = new Date(displayedDates[0]);
            nextWeekDay.setDate(nextWeekDay.getDate() + 7);

            datesToAdd.push(prevWeekDay, nextWeekDay);
            break;
          case 'monthly':
            datesToAdd = [];
            // add current month
            const currentMonthDay = new Date(activityFromDate);
            currentMonthDay.setFullYear(displayedDates[0].getFullYear());
            currentMonthDay.setMonth(displayedDates[0].getMonth());
            // add last month
            const prevMonthDay = new Date(currentMonthDay);
            prevMonthDay.setMonth(displayedDates[0].getMonth() - 1);
            // add next month
            const nextMonthDay = new Date(currentMonthDay);
            nextMonthDay.setMonth(displayedDates[0].getMonth() + 1);

            // check if same date and push
            if (prevMonthDay.getDate() === activityFromDate.getDate())
              datesToAdd.push(prevMonthDay);
            if (currentMonthDay.getDate() === activityFromDate.getDate())
              datesToAdd.push(currentMonthDay);
            if (nextMonthDay.getDate() === activityFromDate.getDate())
              datesToAdd.push(nextMonthDay);

            break;

          case 'monthlyNum': // the n'th (selected) weekday of the month
            datesToAdd = [];

            const weekdayInMonthPlusN = (n) => {
              // set to begining of month
              const nthWeekday = new Date(
                displayedDates[0].getFullYear(),
                displayedDates[0].getMonth() + n,
                1,
                activityFromDate.getHours(),
                activityFromDate.getMinutes()
              );
              // diff in weekday
              const dayDiff = activityFromDate.getDay() - nthWeekday.getDay();

              nthWeekday.setDate(
                nthWeekday.getDate() + (dayDiff >= 0 ? dayDiff : 7 + dayDiff) // the first accurance of the weekday
              );
              // move to the n-th occurrence of that weekday
              const occurrenceInMonth = Math.ceil(
                activityFromDate.getDate() / 7
              );
              nthWeekday.setDate(
                nthWeekday.getDate() + (occurrenceInMonth - 1) * 7
              );
              // check if its still the same month, if not, dont display
              if (
                nthWeekday.getMonth() ===
                (displayedDates[0].getMonth() + n) % 12
              )
                datesToAdd.push(nthWeekday);
            };
            weekdayInMonthPlusN(-1); // before
            weekdayInMonthPlusN(0); // current
            weekdayInMonthPlusN(1); // after
            break;

          case 'monthlyLast': // the last (selected) weekday of the month
            // Reference day from activityFromDate
            const referenceDay = activityFromDate.getDay();

            // Last occurrence in the current month
            const currentMonthLast = getLastDayOfWeekInMonth(
              referenceDay,
              displayedDates[0]
            );

            // Last occurrence in the previous month
            const prevMonthDate = new Date(displayedDates[0]);
            prevMonthDate.setMonth(displayedDates[0].getMonth() - 1);
            const prevMonthLast = getLastDayOfWeekInMonth(
              referenceDay,
              prevMonthDate
            );

            datesToAdd = [prevMonthLast, currentMonthLast];
            break;

          case 'monthlyLastDay': // the last day of the month
            const monthLastDay = new Date(displayedDates[0]);
            monthLastDay.setDate(1); // in case of nex month having lest days and skipping one
            monthLastDay.setMonth(monthLastDay.getMonth() + 1);
            monthLastDay.setDate(0);

            const prevMonthLastDay = new Date(displayedDates[0]);
            prevMonthLastDay.setDate(0);

            const nextMonthLastDay = new Date(displayedDates[0]);
            nextMonthLastDay.setDate(1);
            nextMonthLastDay.setMonth(nextMonthLastDay.getMonth() + 2);
            nextMonthLastDay.setDate(0);

            datesToAdd = [prevMonthLastDay, monthLastDay, nextMonthLastDay];

            break;

          case 'annually':
            const annually = new Date(activityFromDate);
            annually.setFullYear(displayedDates[0].getFullYear());

            const prevAnnually = new Date(activityFromDate);
            prevAnnually.setFullYear(displayedDates[0].getFullYear() - 1);

            const nextAnnually = new Date(activityFromDate);
            nextAnnually.setFullYear(displayedDates[0].getFullYear() + 1);

            datesToAdd = [annually, prevAnnually, nextAnnually];

            break;

          // case for all custom repeat settings
          case 'custom':
            const increment = customDetails.everyNum; // integer increment as to when it repeats in respect to the timeframe (day, week, month ...ect)
            // filter for end recurrence
            const isBeforeLastRecurrence = (diff) => {
              let beforeLastRecurrance = true;
              if (customDetails.ends.type === 'recurrence') {
                beforeLastRecurrance = Math.abs(diff) / increment < endRepeat;
              }
              return beforeLastRecurrance;
            };

            switch (customDetails.everyTimeframe) {
              case 'day':
                datesToAdd = datesToAdd.filter((displayedDate) => {
                  const oneDayInMs = 24 * 60 * 60 * 1000; // Milliseconds in one day
                  const diffInDays = Math.floor(
                    (activityFromDate - displayedDate) / oneDayInMs
                  );

                  return (
                    Math.abs(diffInDays) % increment === 0 &&
                    isBeforeLastRecurrence(diffInDays)
                  );
                });
                break;

              case 'week':
                datesToAdd = datesToAdd.filter((displayedDate) => {
                  const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

                  // normalize to midnight to avoid time discrepancies (displazDate already is)
                  const normalizedActivityFromDate =
                    normalizeToMidnight(activityFromDate);
                  // set to beginning of week (incase from date is not)
                  normalizedActivityFromDate.setDate(
                    normalizedActivityFromDate.getDate() -
                      normalizedActivityFromDate.getDay() -
                      0 // 0 for sunday start 1 for monday (i think)
                  );

                  const diffInWeeks = Math.floor(
                    (displayedDate - normalizedActivityFromDate) / oneWeekInMs
                  );

                  return (
                    customDetails.onEvery.includes(displayedDate.getDay()) &&
                    diffInWeeks % increment === 0 &&
                    isBeforeLastRecurrence(diffInWeeks)
                  );
                });
                break;

              // all different month setting within the custom repeat
              case 'month':
                const isMonthIncrement = (displayedDate) => {
                  // normalize both dates to avoid time discrepancies
                  const normalizedActivityFromDate =
                    normalizeToMidnight(activityFromDate);

                  // calculate the difference in years and months
                  const diffInYears =
                    displayedDate.getFullYear() -
                    normalizedActivityFromDate.getFullYear();
                  const diffInMonths =
                    diffInYears * 12 +
                    (displayedDate.getMonth() -
                      normalizedActivityFromDate.getMonth());

                  // check if the difference in months is a multiple of the increment and if it is same date
                  return (
                    diffInMonths % increment === 0 &&
                    isBeforeLastRecurrence(diffInMonths)
                  );
                };
                switch (customDetails.monthSpec) {
                  case 'monthly':
                    datesToAdd = datesToAdd.filter(
                      (displayedDate) =>
                        displayedDate.getDate() === activityFromDate.getDate()
                    );
                    break;

                  case 'monthlyNum':
                    datesToAdd = [];
                    // TODO: optimize
                    ////// REPETTATIVE
                    const weekdayInMonthPlusN = (n) => {
                      // set to begining of month
                      const nthWeekday = new Date(
                        displayedDates[0].getFullYear(),
                        displayedDates[0].getMonth() + n,
                        1,
                        activityFromDate.getHours(),
                        activityFromDate.getMinutes()
                      );
                      // diff in weekday
                      const dayDiff =
                        activityFromDate.getDay() - nthWeekday.getDay();

                      nthWeekday.setDate(
                        nthWeekday.getDate() +
                          (dayDiff >= 0 ? dayDiff : 7 + dayDiff) // the first accurance of the weekday
                      );
                      // move to the n-th occurrence of that weekday
                      const occurrenceInMonth = Math.ceil(
                        activityFromDate.getDate() / 7
                      );
                      nthWeekday.setDate(
                        nthWeekday.getDate() + (occurrenceInMonth - 1) * 7
                      );

                      // set day to 0 (sunday)
                      nthWeekday.setDate(
                        nthWeekday.getDate() - nthWeekday.getDay()
                      );
                      // add every weekday
                      for (var i = 0; i < customDetails.onEvery.length; i++) {
                        const date = new Date(nthWeekday);
                        date.setDate(date.getDate() + customDetails.onEvery[i]);

                        // check if its still the same month, if not, dont display... Also do not display any if fromDate weekday is not in this month anymore
                        if (
                          nthWeekday.getMonth() ===
                            (displayedDates[0].getMonth() + n) % 12 &&
                          date.getMonth() ===
                            (displayedDates[0].getMonth() + n) % 12
                        ) {
                          datesToAdd.push(date);
                        }
                      }
                    };
                    weekdayInMonthPlusN(0); // current
                    break;

                  case 'monthlyLast':
                    // Last occurrence in the current month
                    const currentMonthLast = getLastDayOfWeekInMonth(
                      referenceDay,
                      displayedDates[0]
                    );

                    // set day to 0 (sunday)
                    currentMonthLast.setDate(
                      currentMonthLast.getDate() - currentMonthLast.getDay()
                    );
                    // add every weekday
                    for (var i = 0; i < customDetails.onEvery.length; i++) {
                      const date = new Date(currentMonthLast);
                      date.setDate(date.getDate() + customDetails.onEvery[i]);

                      // check if its still the same month, if not, dont display... Also do not display any if fromDate weekday is not in this month anymore
                      if (
                        currentMonthLast.getMonth() ===
                          (displayedDates[0].getMonth() + n) % 12 &&
                        date.getMonth() ===
                          (displayedDates[0].getMonth() + n) % 12
                      ) {
                        datesToAdd.push(date);
                      }
                    }
                    break;

                  case 'monthlyLastDay':
                    datesToAdd = [];
                    const monthLastDay = new Date(displayedDates[0]);
                    monthLastDay.setDate(1); // in case next month has less days and will be double skipped
                    monthLastDay.setMonth(monthLastDay.getMonth() + 1);
                    monthLastDay.setDate(0);

                    datesToAdd.push(monthLastDay);
                    break;
                }

                // filter custom month repeats for increments
                if (datesToAdd) {
                  datesToAdd = datesToAdd.filter((displayedDate) =>
                    isMonthIncrement(displayedDate)
                  );
                }
                break;

              case 'year':
                datesToAdd = datesToAdd.filter((displayedDate) => {
                  const diffInYears = Math.floor(
                    activityFromDate.getFullYear() - displayedDate.getFullYear()
                  );
                  return (
                    Math.abs(diffInYears) % increment === 0 &&
                    displayedDate.getMonth() === activityFromDate.getMonth() &&
                    displayedDate.getDate() === activityFromDate.getDate() &&
                    isBeforeLastRecurrence(diffInYears)
                  );
                });
                break;

              default:
                console.error(
                  `invalid custom repetead timeframe: ${customDetails.everyTimeframe}`
                );
                break;
            }

            break;

          default:
            console.error(
              `couldn't find repeating map '${currentSchedule.get(frequency)}' with frequency: ${frequency}`
            );
            return;
        }

        if (
          endRepeat !== 'never' &&
          (!customDetails.ends || customDetails.ends.type !== 'recurrence')
        ) {
          datesToAdd = datesToAdd.filter((date) => date < endRepeat);
        }
        // filter out days after activity from date (compared midnight)
        datesToAdd = datesToAdd.filter((date) => {
          const checkDate = normalizeToMidnight(activityFromDate);
          return date.getTime() >= checkDate.getTime();
        });

        // for every date to add
        for (var i = 0; i < datesToAdd.length; i++) {
          const currentDateToAdd = datesToAdd[i];
          const activityMap = new Map(activityMapSaved);

          if (
            // only add date if its not in exceptions
            !exceptions.some(([start]) => {
              const startObj = normalizeToMidnight(start); // only a max of one individual repteating activity per day
              const activityStart = normalizeToMidnight(currentDateToAdd);
              return startObj.getTime() === activityStart.getTime();
            })
          ) {
            // create displaying dates with specefied time
            const startDay = new Date(activityMap.get('from').toDateString());
            const endDay = new Date(activityMap.get('until').toDateString());
            // get the timespan (for if activity spans over multiple days)
            const dayOccurrences =
              Math.abs(startDay.getTime() - endDay.getTime()) /
              (1000 * 60 * 60 * 24);

            const newFromDate = new Date(
              currentDateToAdd.getFullYear(),
              currentDateToAdd.getMonth(),
              currentDateToAdd.getDate(),
              activityMap.get('from').getHours(),
              activityMap.get('from').getMinutes()
            );

            const newUntilDate = new Date(
              currentDateToAdd.getFullYear(),
              currentDateToAdd.getMonth(),
              currentDateToAdd.getDate() + dayOccurrences,
              activityMap.get('until').getHours(),
              activityMap.get('until').getMinutes()
            );
            activityMap.set('from', newFromDate);
            activityMap.set('until', newUntilDate);
            let activityMapKey = new Map([[key, activityMap]]);
            let activityArray = [datesToAdd[i].toISOString(), activityMapKey];

            // push to all activities
            allActivities.push(activityArray);
          }
        }
      });
  };

  // adds individal activities (for each activity per repeating) as [date, activityMap]
  repeatingFrequencyArr.forEach((frequency) =>
    pushRepeatingToAllActivities(frequency)
  );

  // check if activities span over more than one day
  const activitiesSplitToDays = new Array();
  const multiDayActivities = [[], [], [], [], [], [], []]; // 7 arrays in array for every day of week
  // create individually displayed activities for multiday activities
  allActivities.forEach(([date, activityMap]) => {
    // for each activity with that date time
    activityMap.forEach((activityKey, key) => {
      const activity = {
        key,
        date,
        startTime: activityKey.get('from'),
        endTime: activityKey.get('until'),
        detailsMap: activityKey,
      };
      // only change startTime endTime and date, to display differently in UI
      const startDate = new Date(activity.startTime.toDateString());
      const endDate = new Date(activity.endTime.toDateString());
      const timespanInDays =
        Math.ceil(
          Math.abs(startDate - endDate) / (24 * 60 * 60 * 1000) // calculated form ms to days
        ) + 1;
      // if longer than 24h
      if ((activity.endTime - activity.startTime) / (24 * 60 * 60 * 1000) > 1) {
        if (endDate < displayedDates[0] || startDate > displayedDates[6])
          return;
        const startInThisWeek =
          displayedDates[0] <= startDate && startDate <= displayedDates[6]
            ? startDate
            : displayedDates[0];
        const endInThisWeek =
          displayedDates[0] <= endDate && endDate <= displayedDates[6]
            ? endDate
            : displayedDates[6];
        const timeSpanInThisWeek =
          (endInThisWeek - startInThisWeek) / (24 * 60 * 60 * 1000) + 1;
        // for every day before timespan
        for (
          var i = 0;
          i < startInThisWeek.getDay() - displayedDates[0].getDay();
          i++
        ) {
          multiDayActivities[i].push('place-holder');
        }

        // for every day within the timespan
        for (var i = 0; i < timeSpanInThisWeek; i++) {
          multiDayActivities[(startInThisWeek.getDay() + i) % 7].push(activity);
        }

        // for every day after timespan
        for (var i = endInThisWeek.getDay() + 1; i < 7; i++) {
          multiDayActivities[i].push('place-holder');
        }
      } // if less than 24h
      else if (timespanInDays > 1) {
        // if activity spans over more than one day
        for (var i = 0; i < timespanInDays; i++) {
          const activityStart = new Date(activity.startTime);
          const activityEnd = new Date(activity.endTime);
          if (i === 0) {
            // if it is not the first day of activity
            activityEnd.setTime(activity.startTime.getTime());
            activityEnd.setHours(23);
            activityEnd.setMinutes(59);
          } else {
            // if it is the last day
            activityStart.setTime(activity.endTime.getTime());
            activityEnd.setTime(activity.endTime.getTime());
            activityStart.setHours(0);
            activityStart.setMinutes(0);
          }

          const checkLastDay = new Date(displayedDates[6].toDateString());
          checkLastDay.setDate(checkLastDay.getDate() + 1);
          if (
            activityStart.getTime() !== activityEnd.getTime() && // check if last day is not 00:00 till 00:00 (same day)
            activityStart.getTime() < checkLastDay.getTime() // and not day of next week
          ) {
            const key = activity.key;
            const date = activity.date;
            const startTime = activityStart;
            const endTime = activityEnd;
            const detailsMap = activity.detailsMap;

            activitiesSplitToDays.push({
              key,
              date,
              startTime,
              endTime,
              detailsMap,
            });
          }
        }
      } else activitiesSplitToDays.push(activity);
    });
  });
  activitiesSplitToDays.flat();

  // filter displayed acvitivities to displayed week
  const filteredActivities = activitiesSplitToDays.filter((activity) => {
    const activityFromDate = new Date(
      activity.startTime // get from date
    );
    const activityUntilDate = new Date(
      activity.endTime // get from date
    );
    const firstWeekday = displayedDates[0]; // set starting day of week
    const lastWeekday = new Date(displayedDates[6]); // set end day of week
    lastWeekday.setDate(lastWeekday.getDate() + 1); // set end day to next week first day 00:00

    return !repeatingFrequencyArr.includes(activity.date) // check if date is a date and not a repeating description
      ? activityFromDate >= firstWeekday && activityUntilDate <= lastWeekday
      : false; // remove the repeat object
  });

  return { filteredActivities, multiDayActivities };
}

// set date object to midnight
function normalizeToMidnight(date) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
}

function getLastDayOfWeekInMonth(referenceDay, monthDate) {
  // Set to the last day of the given month
  const lastDayOfMonth = new Date(monthDate);
  lastDayOfMonth.setMonth(monthDate.getMonth() + 1);
  lastDayOfMonth.setDate(0); // Last day of the target month

  // Calculate the difference between the target day and the last day of the month
  const dayDiff = lastDayOfMonth.getDay() - referenceDay;

  // Adjust the last day to get the correct last occurrence of the reference day
  lastDayOfMonth.setDate(
    lastDayOfMonth.getDate() - (dayDiff < 0 ? 7 + dayDiff : dayDiff)
  );

  return lastDayOfMonth;
}
