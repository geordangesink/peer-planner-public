import { html } from 'htm/react';
import { useRef, useState } from 'react';
import Button from '../../components/Button';
import { useRoomActions } from './useRoomActions';

export default function RoomPopup({
  onClose,
  onSave,
  onLeave,
  isVisible,
  isCreate,
  setIsCreate,
}) {
  const { saveRoomInfo, sharedDbObject, roomIdRef } = useRoomActions();

  const [isCreating, setIsCreating] = useState(false);
  const [inviteKey, setInviteKey] = useState('');

  const calendarNameRef = useRef();
  const calendarDescriptionRef = useRef();
  const calendarColorRef = useRef();
  const popupContentRef = useRef();

  const getInfo = () => ({
    name: calendarNameRef.current.value,
    color: calendarColorRef.current.value,
    description: calendarDescriptionRef.current.value,
  });

  const handleCreate = async () => {
    const info = getInfo();
    setIsCreating(true);

    try {
      const room = await saveRoomInfo(isCreate, info, inviteKey);
      if (!room && isCreate) {
        alert('Failed to join or create room. Check the invite key.');
        setIsCreating(false);
        return;
      }
      setInviteKey('');
      setIsCreate(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    const room = sharedDbObject[roomIdRef.current];
    const info = getInfo();
    onSave(room, info);
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (
      popupContentRef.current &&
      !popupContentRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const currentRoom = sharedDbObject[roomIdRef.current];

  return html`
    <div
      className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[1000]"
      onClick=${handleOverlayClick}
    >
      <div
        className="bg-black border border-gray-400/40 p-5 rounded relative w-[600px] h-[400px] shadow-lg flex flex-col items-center justify-center"
        ref=${popupContentRef}
      >
        <button
          className="absolute top-3 right-3 text-xl border-none bg-none cursor-pointer text-white"
          onClick=${onClose}
        >
          ×
        </button>

        <form className="space-y-3 flex flex-col justify-start w-4/5 mb-5">
          <input
            id="calendar-name"
            type="text"
            placeholder="Unnamed Room"
            ref=${calendarNameRef}
            defaultValue=${isCreate ? '' : currentRoom.info.name}
          />
          <textarea
            id="calendar-description"
            placeholder="Description"
            ref=${calendarDescriptionRef}
            defaultValue=${isCreate ? '' : currentRoom.info.description}
          />
          <input
            type="color"
            ref=${calendarColorRef}
            defaultValue=${isCreate ? '#3A037C' : currentRoom.info.color}
          />
        </form>

        ${
          isCreate
            ? html`<input
                type="text"
                placeholder="Paste invite key"
                value=${inviteKey}
                className="text-sm w-4/5 break-words"
                onInput=${(e) => setInviteKey(e.target.value)}
              />`
            : html`<div className="w-4/5 text-sm">
                <h5>Invite Key:</h5>
                <p className="break-words">${currentRoom.inviteHex}</p>
              </div>`
        }

        <${Button}
          variant="square"
          className=${`mt-3 ${isCreate ? 'w-[200px]' : ''}`}
          onClick=${() => (isCreate ? handleCreate() : handleSave())}
          isDisabled=${isCreating}
        >
          ${isCreating ? 'Processing...' : isCreate ? 'Join/Create' : 'Save'}
        </${Button}>

        ${
          !isCreate &&
          html`
          <${Button} variant="square" className="mt-3 text-xs" onClick=${onLeave}>
            Leave Room
          </${Button}>`
        }
      </div>
    </div>
  `;
}
