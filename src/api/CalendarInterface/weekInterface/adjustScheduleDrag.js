// TODO: when using 'allFollowing', make activity to custom repeat and edit endRepeat accordingly

import sodium from "sodium-native";

export default function (currentSchedule, activity) {
  const { key, date, startTime, detailsMap, timeIndexOffset } = activity.oldActivityData;
  // Iterate over the entries of the first map to find the first non-empty map
  // (basically selects the newly created activityMap from the edit window)
  let newSchedule;
  if (activity.newSchedule.size) {
    for (const [key, value] of activity.newSchedule) {
      if (value.size > 0) {
        newSchedule = value.values().next().value;
      }
    }
  }
  const groupKey = detailsMap.get("groupKey");

  // set the relative old start and end time depending on grouping and action
  let oldStartTime = detailsMap.get("from");
  let oldEndTime = detailsMap.get("until");

  if (groupKey && activity.thisOrAll === "all") {
    oldStartTime = new Date(currentSchedule.get(detailsMap.get("repeat")).get(groupKey).get("from"));
    oldEndTime = new Date(currentSchedule.get(detailsMap.get("repeat")).get(groupKey).get("until"));
  }

  // set the new start time based on dragged position or edit input difference to relative old start/end
  let durationInMinutes;
  let targetStartTime;
  if (!newSchedule) {
    durationInMinutes = (new Date(oldEndTime) - new Date(oldStartTime)) / (1000 * 60);
    targetStartTime = new Date(startTime);
    // when activity gets draged and dropped
    targetStartTime.setDate(startTime.getDate() + (activity.dayIndex - startTime.getDay()));
    targetStartTime.setHours(Math.floor((activity.timeIndex - timeIndexOffset) / 4));
    targetStartTime.setMinutes(((activity.timeIndex - timeIndexOffset) % 4) * 15);
  } else {
    durationInMinutes = (new Date(newSchedule.get("until")) - new Date(newSchedule.get("from"))) / (1000 * 60);
    targetStartTime = new Date(newSchedule.get("from"));
  }

  // getting the difference of dropped time and initial time and adding it to the time that needs to be changed (for example for groups)
  const newStartDate = new Date(oldStartTime.getTime() + (targetStartTime.getTime() - startTime.getTime()));
  newStartDate.setDate(newStartDate.getDate() + 0); // +1 if week starts monday, 0 if sunday

  const newEndDate = new Date(newStartDate);
  newEndDate.setMinutes(newStartDate.getMinutes() + durationInMinutes);
  // prepare updated activity detailsMap
  const changedTime = targetStartTime.getTime() - startTime.getTime();
  const updatedActivityDetails = detailsMap;
  const newDate = newStartDate.toISOString();
  updatedActivityDetails.set("from", newStartDate);
  updatedActivityDetails.set("until", newEndDate);

  // update current schedule based on userInput
  const updatedScheduleMap = () => {
    const excludedKeys = ["groupKey", "dateExceptions"];
    const updatedScheduleMap = new Map(currentSchedule);
    const activityGroup = activity.thisOrAll ? updatedScheduleMap.get(detailsMap.get("repeat")).get(groupKey) : null;

    const buffer = Buffer.alloc(32);
    sodium.randombytes_buf(buffer);
    const newKey = buffer.toString("hex");

    switch (activity.thisOrAll) {
      case "all":
        // delete if it is moved beyond endRepeat
        if (
          activityGroup.get("endRepeat") !== "never" &&
          activityGroup.get("endRepeat").getTime() < newStartDate.getTime()
        ) {
          updatedScheduleMap.get(detailsMap.get("repeat")).delete(groupKey);
        } else {
          // set new dates
          excludedKeys.push("from", "until");
          activityGroup.set("from", newStartDate);
          activityGroup.set("until", newEndDate);

          // if edited in configurator (not drag-and-drop)
          if (newSchedule) {
            for (const [key, value] of newSchedule.entries()) {
              if (!excludedKeys.includes(key)) {
                activityGroup.set(key, value);
              }
            }
          }

          // change all exception dates by the ammount dragged object was moved
          let changedExceptionArr = activityGroup // change the time of date exceptions arr
            .get("dateExceptions")
            .map(([start, end, activityKey]) => {
              const dateObjStart = new Date(start);
              const dateObjEnd = new Date(end);
              return [
                new Date(dateObjStart.getTime() + changedTime).toISOString(),
                new Date(dateObjEnd.getTime() + changedTime).toISOString(),
                activityKey,
              ];
            });

          activityGroup.set("dateExceptions", changedExceptionArr);
        }

        break;

      case "allFollowing":
        // delete if it is moved beyond endRepeat
        if (
          activityGroup.get("endRepeat") !== "never" &&
          activityGroup.get("endRepeat").getTime() < newStartDate.getTime()
        ) {
          updatedScheduleMap.get(detailsMap.get("repeat")).delete(groupKey);
        } else {
          const oldActivity = updatedScheduleMap.get(detailsMap.get("repeat")).get(groupKey);
          const endRepeat = new Date(startTime);
          endRepeat.setHours(0, 0, 0, 0);

          oldActivity.set("endRepeat", endRepeat);
          updatedActivityDetails.set("groupKey", newKey);
          if (newSchedule) {
            for (const [key, value] of newSchedule.entries()) {
              if (!excludedKeys.includes(key)) {
                updatedActivityDetails.set(key, value);
              }
            }
          }
          updatedScheduleMap.get(detailsMap.get("repeat")).set(newKey, updatedActivityDetails);
        }

        break;
      case "this":
        const dateExceptionsArr = activityGroup.get("dateExceptions");

        if (newSchedule) {
          for (const [key, value] of newSchedule.entries()) {
            if (!excludedKeys.includes(key)) {
              updatedActivityDetails.set(key, value);
            }
          }
        }

        // edit exceptions
        dateExceptionsArr.push([oldStartTime.toISOString(), oldEndTime.toISOString(), newKey]); // nested key will be the only reference to the newly created activity
        updatedScheduleMap.get(detailsMap.get("repeat")).get(groupKey).set("dateExceptions", dateExceptionsArr);
        // convert group activity to individual
        // TODO: see if can be optimised
        updatedActivityDetails.set("dateExceptions", []);
        updatedActivityDetails.set("groupKey", undefined);
        updatedActivityDetails.set("repeat", "no-repeat");

        const isolatedActivity = new Map([[newKey, updatedActivityDetails]]);

        !updatedScheduleMap.has(newStartDate.toISOString())
          ? updatedScheduleMap.set(newStartDate.toISOString(), isolatedActivity)
          : updatedScheduleMap.get(newStartDate.toISOString()).set(newKey, updatedActivityDetails);

        break;

      default: // non-repeating
        if (newSchedule) {
          for (const [key, value] of newSchedule.entries()) {
            if (!excludedKeys.includes(key)) {
              updatedActivityDetails.set(key, value);
            }
          }
        }

        // remove activity from old date
        const oneDaySchedule = updatedScheduleMap.get(date) || new Map();
        if (oneDaySchedule.has(key)) oneDaySchedule.delete(key);
        if (oneDaySchedule.size === 0) updatedScheduleMap.delete(date);

        // Add activity to new date or repeat
        if (newSchedule && newSchedule.get("repeat") !== "no-repeat") {
          updatedActivityDetails.set("groupKey", newSchedule.get("groupKey"));
          updatedScheduleMap.get(newSchedule.get("repeat")).set(newSchedule.get("groupKey"), updatedActivityDetails);
        } else {
          if (!updatedScheduleMap.has(newDate)) {
            updatedScheduleMap.set(newDate, new Map());
          }
          updatedScheduleMap.get(newDate).set(key, updatedActivityDetails);
          break;
        }
    }

    return updatedScheduleMap;
  };

  return updatedScheduleMap();
}
