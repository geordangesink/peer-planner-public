// TODO: use compact encoding for encoding and decoding
import { html } from 'htm/react';
import { createContext, useEffect, useState, useRef } from 'react';
import { mapToJson, jsonToMap } from '../utils/jsonMapSwitch';
import { RoomManager } from '../lib/RoomManager';

const ScheduleContext = createContext();

const ScheduleProvider = ({ children }) => {
  const [currentSchedule, setCurrentSchedule] = useState(new Map());
  const [sharedDbObject, setSharedDbObject] = useState(new Object());
  const db = useRef();
  const roomManagerRef = useRef(new RoomManager());
  const roomIdRef = useRef('MyCalendar');

  Pear.teardown(async () => {
    await roomManagerRef.current.cleanup();
  });

  useEffect(() => {
    getPersonalSchedule().then(loadSharedSchedules);
  }, []);

  // sets currentSchedule state to personal schedule
  // and mounts personal bee on db ref
  const getPersonalSchedule = async () => {
    try {
      await roomManagerRef.current.ready();
      const bee = roomManagerRef.current.localBee;

      const result = await bee.get('schedule');
      if (result && result.value) {
        const scheduleMap = jsonToMap(result.value.toString());
        setCurrentSchedule(scheduleMap);
      } else {
        const newSchedule = generateCalendarFrame();
        setCurrentSchedule(newSchedule);
        await bee.put('schedule', Buffer.from(mapToJson(newSchedule)));
      }
      db.current = bee;
    } catch (error) {
      console.error('Error initializing Personal database:', error);
    }
  };

  // sets sharedDbObject state to object with all rooms as prop {roomId: room}
  const loadSharedSchedules = async () => {
    const rooms = roomManagerRef.current.rooms;
    if (Object.keys(rooms).length) {
      setSharedDbObject(rooms);
    } else {
      console.log('no shared calendars stored');
    }
  };

  // adds new room (create or join)
  const initCalendarRoom = async (opts = {}) => {
    try {
      const room = await roomManagerRef.current.initReadyRoom({
        ...opts,
        isNew: true,
      });
      if (!room) return null;

      roomIdRef.current = room.roomId;

      const bee = room.autobee;
      const scheduleObj = await bee.get('schedule');

      let scheduleMap;
      if (scheduleObj && scheduleObj.value) {
        scheduleMap = jsonToMap(scheduleObj.value.toString());
      } else {
        scheduleMap = new Map();
      }
      setCurrentSchedule(scheduleMap);
      setSharedDbObject(roomManagerRef.current.rooms);

      return room;
    } catch (error) {
      console.error('Error initializing Shared database:', error);
    }
  };

  // edits the database and state of current schedule
  const editCurrentSchedule = async (updated) => {
    setCurrentSchedule(updated);

    // update personal schedule
    if (roomIdRef.current === 'MyCalendar') {
      if (db.current && db.current.writable) {
        try {
          await db.current.put('schedule', Buffer.from(mapToJson(updated)));
        } catch (err) {
          console.error('Error updating schedule in personal database:', err);
        }
      }
    } else {
      if (
        sharedDbObject[roomIdRef.current] &&
        sharedDbObject[roomIdRef.current].autobee.writable
      ) {
        const bee = sharedDbObject[roomIdRef.current].autobee;
        try {
          await bee.put('schedule', Buffer.from(mapToJson(updated)));
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
        db,
        roomManagerRef,
        roomIdRef,
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
