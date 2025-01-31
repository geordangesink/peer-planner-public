import { html } from 'htm/react';
import { useRef, useState } from 'react';
import Button from '../../components/Button';
import { useRoomActions } from './useRoomActions';

export default function RoomPopup({
  onClose,
  onSave,
  onLeave,
  isCreate,
  setIsCreate,
}) {
  const { saveRoomInfo, sharedDbObject, roomIdRef } = useRoomActions();

  const [isCreating, setIsCreating] = useState(false);
  const [inviteKey, setInviteKey] = useState('');

  const calendarNameRef = useRef();
  const calendarDescriptionRef = useRef();
  const calendarColorRef = useRef();

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

  const currentRoom = sharedDbObject[roomIdRef.current];

  return html`

    
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
  `;
}
