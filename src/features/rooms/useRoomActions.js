import useSchedule from '../../hooks/useSchedule';

/**
 * Hook for actions on room info window
 */
export default () => {
  const { initCalendarRoom, sharedDbObject, roomIdRef } = useSchedule();

  const joinRoom = async (info, inviteKey) => {
    try {
      return await initCalendarRoom({ info, invite: inviteKey });
    } catch (error) {
      console.error('Failed to join room:', error);
      return null;
    }
  };

  const saveRoomInfo = async (isCreate, info, inviteKey) => {
    if (isCreate) {
      return inviteKey
        ? await joinRoom(info, inviteKey)
        : await initCalendarRoom({ info });
    } else {
      const room = sharedDbObject[roomIdRef.current];
      return room;
    }
  };

  return { saveRoomInfo, sharedDbObject, roomIdRef };
};
