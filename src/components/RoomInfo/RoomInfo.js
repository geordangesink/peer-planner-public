// FIX-BUG: same calendars can be joined multiple times
// can be solved by improving invites (make a list of active invites)
import { html } from "htm/react";
import { useRef, useState } from "react";
import useSchedule from "../../hooks/useSchedule";

export default ({ onClose, onSave, onLeave, isVisible, isCreate, setIsCreate }) => {
  const { sharedDbObject, roomIdRef, initCalendarRoom, setCurrentCalendarInfo } = useSchedule();
  const [isCreating, setIsCreating] = useState(false);
  const [inviteKey, setInviteKey] = useState("");
  const calendarNameRef = useRef("Unnamed Room");
  const calendarDescriptionRef = useRef("");
  const calendarColorRef = useRef();
  const popupContentRef = useRef(null);

  const handleSave = async () => {
    const info = {
      name: calendarNameRef.current.value || "Unnamed Room",
      color: calendarColorRef.current.value,
      description: calendarDescriptionRef.current.value,
    };
    if (isCreate) {
      setIsCreating(true);
      if (inviteKey) await joinRoom(info, inviteKey);
      else await initCalendarRoom({ info });
      setInviteKey("");
      setIsCreate(false);
      setIsCreating(false);
    } else {
      const room = sharedDbObject[roomIdRef.current];
      onSave(room, info);
      onClose();
    }
    setCurrentCalendarInfo(info);
  };

  const handleOverlayClick = (e) => {
    if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
      onClose();
    }
  };

  // TODO: handle errors for wrong key
  const joinRoom = async (info, inviteKey) => {
    let bee = false;
    // only handles not joining with same invite key
    for (const roomId in sharedDbObject) {
      const room = sharedDbObject[roomId];
      if (room.invite === inviteKey) {
        bee = room.autobee;
        roomIdRef.current = roomId;
        break;
      }
    }
    if (!bee) {
      await initCalendarRoom({ info, invite: inviteKey });
    } else {
      const schedule = await bee.get("schedule");
      if (schedule && schedule.value && Object.keys(schedule.value).length !== 0) {
        setCurrentSchedule(jsonToMap(schedule.value.toString()));
      } else {
        setCurrentSchedule(new Map());
      }
    }
  };

  if (!isVisible) return null;

  return html`
    <div className="popup-overlay" onClick=${handleOverlayClick}>
      <div className="popup-content" ref=${popupContentRef}>
        <button className="popup-close" onClick=${onClose}>x</button>
        <form>
          <input
            id="activity-title"
            type="text"
            placeholder="Unnamed Room"
            ref=${calendarNameRef}
            defaultValue=${isCreate || sharedDbObject[roomIdRef.current].info.name === "Unnamed Room"
              ? ""
              : sharedDbObject[roomIdRef.current].info.name}
          />
          <textarea
            id="activity-description"
            ref=${calendarDescriptionRef}
            placeholder="Description"
            defaultValue=${isCreate ? "" : sharedDbObject[roomIdRef.current].info.description}
          />
          <input
            type="color"
            ref=${calendarColorRef}
            defaultValue=${isCreate ? "#3A037C" : sharedDbObject[roomIdRef.current].info.color}
          />
        </form>
        ${isCreate
          ? !isCreating &&
            html`<input
              type="text"
              placeholder="paste invite to join existing calendar"
              className="invite-hex"
              onChange=${(e) => setInviteKey(e.target.value)}
            />`
          : html`<h5>InviteKey:</h5>
              <p className="invite-hex">${sharedDbObject[roomIdRef.current].inviteHex}</p>`}
        ${(!isCreate || !isCreating) &&
        html`<button className="button-square button-save" onClick=${handleSave}>
          ${isCreate ? "Join/Create" : "Save"}
        </button>`}
        ${!isCreate &&
        html`<button
          className="button-square button-save not-clickable"
          onClick=${() => onLeave(sharedDbObject[roomIdRef.current])}
        >
          Leave Room
        </button>`}
      </div>
    </div>
  `;
};
