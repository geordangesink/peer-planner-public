import useSchedule from '../../hooks/useSchedule';

/**
 * Hook for actions on room info window
 */
export default () => {
  const { initCalendarRoom, sharedDbObject, localIdRef, roomManagerRef } = useSchedule();

  const joinRoom = async (inviteKey, info) => {
    try {
      return await initCalendarRoom({ inviteKey, custom: info });
    } catch (error) {
      console.error('Failed to join room:', error);
      return null;
    }
  };

  const saveRoomInfo = async (isCreate, info, inviteKey) => {
    if (isCreate) {
      return inviteKey
        ? await joinRoom(inviteKey, info)
        : await initCalendarRoom({ custom: info });
    } else {
      const room = sharedDbObject[localIdRef.current];
      room.custom = info
      roomManagerRef.current.saveFlock(room)
      return room;
    }
  };

  return { saveRoomInfo, sharedDbObject, localIdRef };
};
