// can be solved by improving invites (make a list of active invites)
import { html } from 'htm/react';
import { useRef, useState } from 'react';
import ButtonSquare from './ButtonSquare';
import useSchedule from '../hooks/useSchedule';

export default ({
  onClose,
  onSave,
  onLeave,
  isVisible,
  isCreate,
  setIsCreate,
}) => {
  const {
    sharedDbObject,
    roomIdRef,
    initCalendarRoom,
    setCurrentCalendarInfo,
  } = useSchedule();
  const [isCreating, setIsCreating] = useState(false);
  const [inviteKey, setInviteKey] = useState('');
  const calendarNameRef = useRef();
  const calendarDescriptionRef = useRef();
  const calendarColorRef = useRef();
  const popupContentRef = useRef(null);

  const handleSave = async () => {
    const info = {
      name: calendarNameRef.current.value || 'Unnamed Room',
      color: calendarColorRef.current.value,
      description: calendarDescriptionRef.current.value,
    };
    if (isCreate) {
      setIsCreating(true);

      if (inviteKey) {
        const room = await joinRoom(info, inviteKey);

        // TODO: handle error in case of undifined roomId (wrong invite) better
        if (!room) {
          onClose();
          setInviteKey('');
          setIsCreating(false);
          return;
        }
      } else await initCalendarRoom({ info });

      setInviteKey('');
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
    if (
      popupContentRef.current &&
      !popupContentRef.current.contains(e.target)
    ) {
      onClose();
    }
  };

  // TODO: handle errors for wrong key
  const joinRoom = async (info, inviteKey) => {
    const room = await initCalendarRoom({ info, invite: inviteKey });
    return room;
  };

  if (!isVisible) return null;

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
          className="absolute top-[10px] right-[10px] text-[1.5rem] border-none bg-none cursor-pointer text-white"
          onClick=${onClose}
        >
          x
        </button>
        <form className="space-y-1 flex flex-col justify-start w-[80%] mb-5">
          <input
            id="activity-title"
            type="text"
            placeholder="Unnamed Room"
            ref=${calendarNameRef}
            defaultValue=${isCreate ||
            sharedDbObject[roomIdRef.current].info.name === 'Unnamed Room'
              ? ''
              : sharedDbObject[roomIdRef.current].info.name}
          />
          <textarea
            id="activity-description"
            ref=${calendarDescriptionRef}
            placeholder="Description"
            defaultValue=${isCreate
              ? ''
              : sharedDbObject[roomIdRef.current].info.description}
          />
          <input
            type="color"
            ref=${calendarColorRef}
            defaultValue=${isCreate
              ? '#3A037C'
              : sharedDbObject[roomIdRef.current].info.color}
          />
        </form>
        ${isCreate
          ? !isCreating &&
            html`<input
              type="text"
              placeholder="paste invite to join existing calendar"
              className="text-[0.8rem] w-[80%] break-words"
              onChange=${(e) => setInviteKey(e.target.value)}
            />`
          : html`<h5>InviteKey:</h5>
              <p className="text-[0.8rem] w-[80%] break-words">
                ${sharedDbObject[roomIdRef.current].inviteHex}
              </p>`}
        ${(!isCreate || !isCreating) &&
        html`<${ButtonSquare}
          className=${`mt-3 ${isCreate && 'w-[200px]'}`}
          onClick=${handleSave}
        >
          ${isCreate ? 'Join/Create' : 'Save'}
        </button>`}
        ${!isCreate &&
        html`<${ButtonSquare}
          className='mt-3 text-xs'
          onClick=${onLeave}
        >
          Leave Room
        </>`}
      </div>
    </div>
  `;
};
