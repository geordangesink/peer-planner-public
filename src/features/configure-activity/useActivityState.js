import sodium from 'sodium-native';
import { useState, useRef, useMemo } from 'react';
import { formatDate, formatTime } from './formatDateTime';
import useSchedule from '../../hooks/useSchedule';

/**
 * Helper function to create and return all information of an edited or created
 * activity using the information from the ActivityForm.
 *
 * @param {Object} oldActivityData - The data of the activity being edited (if applicable).
 * @param {boolean} isCreate - Indicates if the function is creating a new activity (`true`) or editing an existing one (`false`).
 *
 * @returns {Map} - The complete activity data after creation or edit.
 */
export default (oldActivityData, isCreate) => {
  const { sharedDbObject, localIdRef } = useSchedule();
  const editOpts = useMemo(() => {
    if (!oldActivityData || isCreate) return {};
    return {
      ...oldActivityData,
      fromDate: formatDate(oldActivityData.from),
      fromTime: formatTime(oldActivityData.from),
      untilDate: formatDate(oldActivityData.until),
      untilTime: formatTime(oldActivityData.until),
    };
  }, [oldActivityData, isCreate]);

  const [isEvent, setIsEvent] = useState(true); // by default, 'event' is active
  const customRepeatRef = useRef('');
  const titleRef = useRef('');
  const fromDateRef = useRef('');
  const fromTimeRef = useRef('');
  const untilDateRef = useRef('');
  const untilTimeRef = useRef('');
  const descriptionRef = useRef('');
  const repeatRef = useRef('no-repeat');
  const colorRef = useRef('#7B0323');
  const notificationRef = useRef('30m');

  // generate the activity object
  const getActivityObject = () => {
    const fromUTC = new Date(
      fromDateRef.current.value + 'T' + fromTimeRef.current.value
    );
    const untilUTC = new Date(
      untilDateRef.current.value + 'T' + untilTimeRef.current.value
    );

    const buffer = Buffer.alloc(32);
    sodium.randombytes_buf(buffer);
    const randomString = buffer.toString('hex'); // create random key

    // check for repeat (name the map after date or repeat)
    let fromDateOrRepeat;
    let groupKey;
    if (repeatRef.current.value === 'no-repeat') {
      fromDateOrRepeat = fromUTC.toISOString();
    } else {
      sodium.randombytes_buf(buffer);
      fromDateOrRepeat = repeatRef.current.value;
      groupKey = buffer.toString('hex');
    }

    const key = groupKey || randomString;
    const value = new Map([
      ['from', fromUTC], // Date Object
      ['until', untilUTC], // Date Object
      ['dateExceptions', []], // Array of Arrays [Date Objectd, Date Object, 32hex key]
      ['groupKey', groupKey], // 32byte hex key String
      ['isEvent', isEvent], // Bool
      [
        'title',
        titleRef.current.value === '' ? '(No Title)' : titleRef.current.value,
      ], // String
      ['description', descriptionRef.current.value], // String
      ['complete', isEvent ? undefined : false], // Bool
      ['notification', notificationRef.current.value], // String
      ['repeat', repeatRef.current.value], // String
      [
        'endRepeat',
        (customRepeatRef.current.ends && customRepeatRef.current.ends.spec) ||
          'never',
      ], // Date Object or String ("never")
      ['customRepeat', customRepeatRef.current], // cuntom repeat object
      ['color', sharedDbObject[localIdRef.current]?.custom.color === colorRef.current.value ? undefined : colorRef.current.value], // Hex String
    ]);
    // TODO: right now 'custumRepeat' object has a .ends.type and .ends.spec prop...\
    // however it only needs the .ends.type (recurrance or date), sice the 'endRepeat' key
    // already holds the end date and is also supposed to hold the recurrance if that is the respective type
    customRepeatRef.current = {};

    const activityMap = new Map([[key, value]]);
    return new Map([[fromDateOrRepeat, activityMap]]);
  };

  return {
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
    isEvent,
    setIsEvent,
    getActivityObject,
    editOpts,
  };
};
