import { html } from 'htm/react';
import { createContext, useEffect, useState, useRef } from 'react';
import FlockManager from 'flockmanager';

// TODO: use compact encoding for encoding and decoding

/**
 * Loads, mounts and selects personal calendar Schedule on Start
 * Loads and mounts all Room Schdeules
 */
const ScheduleContext = createContext();

const ScheduleProvider = ({ children }) => {
  const [currentSchedule, setCurrentSchedule] = useState(new Map());
  const [sharedDbObject, setSharedDbObject] = useState(new Object());
  const roomManagerRef = useRef(new FlockManager());
  const localIdRef = useRef('MyCalendar');

  Pear.teardown(async () => {
    await roomManagerRef.current.cleanup();
  });

  useEffect(() => {
    getPersonalSchedule().then(loadSharedSchedules);
  }, []);

  // sets currentSchedule state to personal schedule
  const getPersonalSchedule = async () => {
    try {
      await roomManagerRef.current.ready();

      const result = await roomManagerRef.current.get('schedule');
      if (result) {
        setCurrentSchedule(result);
      } else {
        const newSchedule = generateCalendarFrame();
        setCurrentSchedule(newSchedule);
        await roomManagerRef.current.set('schedule', newSchedule);
      }
    } catch (error) {
      console.error('Error initializing Personal database:', error);
    }
  };

  // sets sharedDbObject state to object with all rooms as prop {localId: room}
  const loadSharedSchedules = async () => {
    const rooms = roomManagerRef.current.flocks;
    if (Object.keys(rooms).length) {
      setSharedDbObject(rooms);
    } else {
      console.log('no shared calendars stored');
    }
  };

  // adds new room (create or join)
  const initCalendarRoom = async (opts = {}) => {
    try {
      const room = await roomManagerRef.current.initFlock(opts.inviteKey, {...opts});
      console.log(opts.custom)
      if (!room) return null;

      localIdRef.current = room.localId;
      const scheduleObj = await room.get('schedule');

      let scheduleMap;
      if (scheduleObj) {
        scheduleMap = scheduleObj;
      } else {
        scheduleMap = generateCalendarFrame();
      }
      setCurrentSchedule(scheduleMap);
      setSharedDbObject(roomManagerRef.current.flocks);

      return room;
    } catch (error) {
      console.error('Error initializing Shared database:', error);
    }
  };

  // edits the database and state of current schedule
  const editCurrentSchedule = async (updated) => {
    setCurrentSchedule(updated);

    // update personal schedule
    if (localIdRef.current === 'MyCalendar') {
      if (roomManagerRef.current.localBee && roomManagerRef.current.localBee.writable) {
        try {
          console.log()
          await roomManagerRef.current.set('schedule', updated);
        } catch (err) {
          console.error('Error updating schedule in personal database:', err);
        }
      }
    } else {
      if (sharedDbObject[localIdRef.current] && sharedDbObject[localIdRef.current].autobee.writable) {
        console.log('UPDATING')
        const room = sharedDbObject[localIdRef.current];
        try {
          await room.set('schedule', updated);
        } catch (err) {
          console.error('Error updating schedule in shared database:', err);
        }
      } else {
        console.error('No room or not writable');
      }
    }
  };

  // switches the displayed schedule state
  const changeDisplayedSchedule = (scheduleMap) => {
    setCurrentSchedule(scheduleMap);
  };

  return html`
    <${ScheduleContext.Provider}
      value=${{
        roomManagerRef,
        localIdRef,
        currentSchedule,
        sharedDbObject,
        changeDisplayedSchedule,
        editCurrentSchedule,
        initCalendarRoom,
        getPersonalSchedule,
      }}
    >
      ${children}
    </${ScheduleContext.Provider}>
  `;
};

export { ScheduleContext, ScheduleProvider };

// schedule skeleton map
function generateCalendarFrame() {
  return new Map([
    ['daily', new Map()],
    ['weekdays', new Map()],
    ['weekly', new Map()],
    ['monthly', new Map()],
    ['monthlyNum', new Map()],
    ['monthlyLast', new Map()],
    ['monthlyLastDay', new Map()],
    ['annually', new Map()],
    ['custom', new Map()],
  ]);
}
