import { html } from 'htm/react';
import { useRef, useState } from 'react';
import Button from '../../components/Button';
import useRoomActions from './useRoomActions';
import useSchedule from '../../hooks/useSchedule';

/**
 * Interface for room information or creation (and joining).
 * Also handles edits to room info, such as color, name, etc.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.onClose] - Callback function executed when closing the component.
 * @param {Function} [props.onLeave] - Callback function executed when leaving the room.
 * @param {boolean} [props.isCreate] - Indicates if the form is for creating a new room (`true`) or editing an existing room (`false`).
 * @param {Function} [props.setIsCreate] - Callback function to toggle the state of creating a new room (`true`) or editing an existing one (`false`).
 */
export default ({ onClose, onLeave, isCreate, setIsCreate }) => {
  const { saveRoomInfo, sharedDbObject, localIdRef } = useRoomActions();
  const { roomManagerRef } = useSchedule();

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

  const handleSave = async () => {
    const info = getInfo();
    setIsCreating(true);
    console.log(info)

    try {
      const room = await saveRoomInfo(isCreate, info, inviteKey);
      if (!room && isCreate) {
        alert('Failed to join or create room. Check the invite key.');
        setIsCreating(false);
        return;
      } else if (!isCreate) {
        onClose();
      }
      setInviteKey('');
      setIsCreate(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const currentRoom = sharedDbObject[localIdRef.current];

  return html`

    
        <form className="space-y-3 flex flex-col justify-start w-4/5 mb-5">
          <input
            id="calendar-name"
            type="text"
            placeholder="Unnamed Room"
            ref=${calendarNameRef}
            defaultValue=${isCreate ? '' : currentRoom.custom.name}
          />
          <textarea
            id="calendar-description"
            placeholder="Description"
            ref=${calendarDescriptionRef}
            defaultValue=${isCreate ? '' : currentRoom.custom.description}
          />
          <input
            type="color"
            ref=${calendarColorRef}
            defaultValue=${isCreate ? '#3A037C' : currentRoom.custom.color}
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
                <p className="break-words">${currentRoom.invite}</p>
              </div>`
        }

        <${Button}
          variant='square'
          className='mt-3'
          width=${(isCreate || isCreating) && 'wide'}
          onClick=${handleSave}
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
};
