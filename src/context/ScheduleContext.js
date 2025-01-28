// TODO: use compact encoding for encoding and decoding
import { html } from 'htm/react';
import { createContext, useEffect, useState, useRef } from 'react';
import { mapToJson, jsonToMap } from '../utils/json-map-switch';
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

  const getPersonalSchedule = async () => {
    try {
      await roomManagerRef.current.ready();
      const bee = roomManagerRef.current.localBee;

      const result = await bee.get('schedule');
      if (result && result.value) {
        const scheduleMap = jsonToMap(result.value.toString());
        setCurrentSchedule(scheduleMap);
      } else {
        const newSchedule = new Map();
        setCurrentSchedule(newSchedule);
        await bee.put('schedule', Buffer.from(mapToJson(newSchedule)));
      }
      db.current = bee;
    } catch (error) {
      console.error('Error initializing Personal database:', error);
    }
  };

  const loadSharedSchedules = async () => {
    const rooms = roomManagerRef.current.rooms;
    if (Object.keys(rooms).length) {
      setSharedDbObject(rooms);
    } else {
      console.log('no shared calendars stored');
    }
  };

  // add new shared schedule db
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

  const setSchedule = async (updated) => {
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
      // update shared schedule
      //////// NEED TO EDIT
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

  return html`
    <${ScheduleContext.Provider}
      value=${{
        db,
        roomManagerRef,
        roomIdRef,
        currentSchedule,
        sharedDbObject,
        setCurrentSchedule,
        setSchedule,
        initCalendarRoom,
        getPersonalSchedule,
      }}
    >
      ${children}
    </${ScheduleContext.Provider}>
  `;
};

export { ScheduleContext, ScheduleProvider };
