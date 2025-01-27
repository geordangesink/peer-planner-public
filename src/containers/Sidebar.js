import { html } from "htm/react";
import { useState } from "react";
import CurrentTime from "../components/CurrentTime";
import MonthDaysView from "../components/MonthDaysView";
import PeersView from "../components/PeersView";
import RoomInfo from "../components/RoomInfo";
import RoomsList from "../components/RoomsList";
import useSchedule from "../hooks/useSchedule";
import useIsVisible from "../hooks/useIsVisible";

export default () => {
  const roomInfoComp = useIsVisible();
  const { roomManagerRef } = useSchedule();
  const [isCreate, setIsCreate] = useState(false);

  const handleLeave = async (room) => {
    // need to add function to roomManager
    // sharedDbObject[room.roomId] = undefined;
    await roomManagerRef.current.deleteRoom(room);
  };

  const updateRoomInfo = async (room, info) => {
    room.info = info;
    await roomManagerRef.current.updateRoomInfo(room);
  };

  return html`
    <nav className="flex w-[250px] min-w-[250px] bg-sidebar flex-col items-center border-r border-gray-40">
      <${CurrentTime} />
      <${MonthDaysView} />
      <${PeersView} setIsCreate=${setIsCreate} roomInfoComp=${roomInfoComp} />
      <${RoomInfo}
        onClose=${() => {
          roomInfoComp.handleMakeInvisible();
          setIsCreate(false);
        }}
        onSave=${updateRoomInfo}
        onLeave=${handleLeave}
        setIsCreate=${setIsCreate}
        isCreate=${isCreate}
        isVisible=${roomInfoComp.isVisible}
      />
      <${RoomsList} roomInfoComp=${roomInfoComp} />
    </nav>
  `;
};
