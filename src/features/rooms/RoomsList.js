import { html } from 'htm/react';
import { jsonToMap } from '../../utils/parseMapJson';
import useSchedule from '../../hooks/useSchedule';

/**
 * Displays a list of all created and joined rooms, without distinguishing
 * between reader-only and editable rooms.
 *
 * @param {Object} props - The component props.
 * @param {boolean} [props.visibilityRoomInfo] - Controls the visibility of the room information.
 */
export default ({ visibilityRoomInfo }) => {
  const { sharedDbObject, roomIdRef, changeDisplayedSchedule } = useSchedule();

  const handleClickRoom = async (roomId, room) => {
    if (roomIdRef.current === roomId) {
      visibilityRoomInfo.handleMakeVisible();
    }
    roomIdRef.current = roomId;

    // TODO: update dynamically
    const bee = room.autobee;
    const schedule = await bee.get('schedule');
    if (
      schedule &&
      schedule.value &&
      Object.keys(schedule.value).length !== 0
    ) {
      changeDisplayedSchedule(jsonToMap(schedule.value.toString()));
    } else {
      changeDisplayedSchedule(new Map());
    }
  };

  return html`
    <section className="w-full overflow-y-auto overflow-x-hidden">
      ${Object.entries(sharedDbObject).map(([roomId, room]) => {
        if (roomId && room) {
          return html`
            <section
              className=${`w-full flex items-center cursor-pointer border-b border-gray-500/20 hover:bg-hoverButton ${roomId === roomIdRef.current ? 'bg-[#2a2c2e]' : ''}`}
              key=${roomId + 'room-preview'}
              onClick=${() => handleClickRoom(roomId, room)}
            >
              <div
                className="w-[40px] h-[40px] bg-black m-[5px] cursor-pointer"
                style=${{ backgroundColor: room.info.color }}
              ></div>
              <section
                className="flex mr-[5px] flex-col justify-around cursor-pointer"
              >
                <h5 className="cursor-pointer text-[1.2rem]">
                  ${room.info.name || 'Unnamed Room'}
                </h5>
                <span className="room-description cursor-pointer text-[0.7rem]"
                  >${room.info.description}</span
                >
              </section>
            </section>
          `;
        }
        return null;
      })}
    </section>
  `;
};
