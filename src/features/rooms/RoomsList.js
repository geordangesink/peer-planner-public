import { html } from 'htm/react';
import useSchedule from '../../hooks/useSchedule';

/**
 * Displays a list of all created and joined rooms, without distinguishing
 * between reader-only and editable rooms.
 *
 * @param {Object} props - The component props.
 * @param {boolean} [props.visibilityRoomInfo] - Controls the visibility of the room information.
 */
export default ({ visibilityRoomInfo }) => {
  const { sharedDbObject, localIdRef, changeDisplayedSchedule } = useSchedule();

  const handleClickRoom = async (localId, room) => {
    if (localIdRef.current === localId) {
      visibilityRoomInfo.handleMakeVisible();
    }
    localIdRef.current = localId;
    console.log(localId)

    // TODO: update dynamically
    const schedule = await room.get('schedule');
    if (schedule) {
      changeDisplayedSchedule(schedule);
    } else {
      changeDisplayedSchedule(new Map());
    }
  };

  return html`
    <section className="w-full overflow-y-auto overflow-x-hidden">
      ${Object.entries(sharedDbObject).map(([localId, room]) => {
        if (localId && room) {
          return html`
            <section
              className=${`w-full flex items-center cursor-pointer border-b border-gray-500/20 hover:bg-hoverButton ${localId === localIdRef.current ? 'bg-[#2a2c2e]' : ''}`}
              key=${localId + 'room-preview'}
              onClick=${() => handleClickRoom(localId, room)}
            >
              <div
                className="w-[40px] h-[40px] bg-black m-[5px] cursor-pointer"
                style=${{ backgroundColor: room.custom.color }}
              ></div>
              <section className="flex mr-[5px] flex-col justify-around cursor-pointer">
                <h5 className="cursor-pointer text-[1.2rem]">
                  ${room.custom.name || 'Unnamed Room'}
                </h5>
                <span className="room-description cursor-pointer text-[0.7rem]"
                  >${room.custom.description}</span
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
