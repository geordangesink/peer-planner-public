import { html } from 'htm/react';
import { useState } from 'react';
import MonthDaysView from '../features/date-quick-select/MonthDaysView';
import ConnectionTools from '../features/rooms/ConnectionTools';
import RoomInfo from '../features/rooms/RoomInfo';
import RoomsList from '../features/rooms/RoomsList';
import PopupWindow from '../components/PopupWindow';
import useSchedule from '../hooks/useSchedule';
import useVisibility from '../hooks/useVisibility';

/**
 * Container for left sidebar (grey)
 */
export default () => {
  const visibilityRoomInfo = useVisibility();
  const { roomManagerRef } = useSchedule();
  const [isCreate, setIsCreate] = useState(false);

  const handleLeave = async (room) => {
    // TODO: need to add function to roomManager
    // sharedDbObject[room.roomId] = undefined;
    await roomManagerRef.current.deleteRoom(room);
  };

  return html`
    <nav
      className="flex w-[250px] min-w-[250px] bg-sidebar flex-col items-center border-r border-gray-40"
    >
      <${MonthDaysView} />
      <${ConnectionTools} setIsCreate=${setIsCreate} visibilityRoomInfo=${visibilityRoomInfo} />
      <${PopupWindow}
        isVisible=${visibilityRoomInfo.isVisible}
        onClose=${() => {
          visibilityRoomInfo.handleMakeInvisible();
          setIsCreate(false);
        }}
        widthPx=${600}
        heightPx=${400}
      >
        <${RoomInfo}
          onClose=${() => {
            visibilityRoomInfo.handleMakeInvisible();
            setIsCreate(false);
          }}
          onLeave=${handleLeave}
          setIsCreate=${setIsCreate}
          isCreate=${isCreate}
        />
      </>
      <${RoomsList} visibilityRoomInfo=${visibilityRoomInfo} />
    </nav>
  `;
};
