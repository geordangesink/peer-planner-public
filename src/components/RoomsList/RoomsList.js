import { html } from "htm/react";
import { jsonToMap } from "../../api/json-map-switch";
import useSchedule from "../../hooks/useSchedule";

export default ({ roomInfoComp }) => {
  const { sharedDbObject, roomIdRef, setCurrentSchedule, setCurrentCalendarInfo } = useSchedule();

  const handleClickRoom = async (roomId, room) => {
    if (roomIdRef.current === roomId) {
      roomInfoComp.handleMakeVisible();
    }
    roomIdRef.current = roomId;
    setCurrentCalendarInfo(room.info);

    // TODO: update dynamically
    const bee = room.autobee;
    const schedule = await bee.get("schedule");
    if (schedule && schedule.value && Object.keys(schedule.value).length !== 0) {
      setCurrentSchedule(jsonToMap(schedule.value.toString()));
    } else {
      setCurrentSchedule(new Map());
    }
  };

  return html`
    <section className="rooms-list">
      ${Object.entries(sharedDbObject).map(([roomId, room]) => {
        if (roomId && room) {
          return html`
            <section
              className=${`room-preview ${roomId === roomIdRef.current ? "selected-room" : ""}`}
              key=${roomId + "room-preview"}
              onClick=${() => handleClickRoom(roomId, room)}
            >
              <div className="image" style=${{ backgroundColor: room.info.color }}></div>
              <section className="room-details">
                <h5>${room.info.name}</h5>
                <span className="room-description">${room.info.description}</span>
              </section>
            </section>
          `;
        }
        return null;
      })}
    </section>
  `;
};
