import { html } from 'htm/react';
import { useState } from 'react';
import MonthDaysView from '../features/date-quick-select/MonthDaysView';
import ConnectionTools from '../features/rooms/ConnectionTools';
import RoomInfo from '../features/rooms/RoomInfo';
import RoomsList from '../features/rooms/RoomsList';
import PopupWindow from '../components/PopupWindow';
import useSchedule from '../hooks/useSchedule';
import useIsVisible from '../hooks/useIsVisible';

export default () => {
  const roomInfoComp = useIsVisible();
  const { roomManagerRef } = useSchedule();
  const [isCreate, setIsCreate] = useState(false);

  const handleLeave = async (room) => {
    // TODO: need to add function to roomManager
    // sharedDbObject[room.roomId] = undefined;
    await roomManagerRef.current.deleteRoom(room);
  };

  const updateRoomInfo = async (room, info) => {
    room.info = info;
    await roomManagerRef.current.updateRoomInfo(room);
  };

  return html`
    <nav
      className="flex w-[250px] min-w-[250px] bg-sidebar flex-col items-center border-r border-gray-40"
    >
      <${MonthDaysView} />
      <${ConnectionTools} setIsCreate=${setIsCreate} roomInfoComp=${roomInfoComp} />
      <${PopupWindow}
        isVisible=${roomInfoComp.isVisible}
        onClose=${() => {
          roomInfoComp.handleMakeInvisible();
          setIsCreate(false);
        }}
        widthPx=${600}
        heightPx=${400}
      >
        <${RoomInfo}
          onClose=${() => {
            roomInfoComp.handleMakeInvisible();
            setIsCreate(false);
          }}
          onSave=${updateRoomInfo}
          onLeave=${handleLeave}
          setIsCreate=${setIsCreate}
          isCreate=${isCreate}
        />
      </>
      <${RoomsList} roomInfoComp=${roomInfoComp} />
    </nav>
  `;
};
