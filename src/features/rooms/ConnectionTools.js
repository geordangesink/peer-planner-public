import { html } from 'htm/react';
import { useState } from 'react';
import Button from '../../components/Button';

// TODO: move components to sidebar container

/**
 * Enables room quick search (in progress) and functionality for joining or creating a new room.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.setIsCreate] - Callback function to set whether the form is for creating a new room (`true`) or not (`false`).
 * @param {Object} [props.visibilityRoomInfo] - custom hook to manage visibility of roominfo component
 */
export default ({ setIsCreate, visibilityRoomInfo }) => {
  const [searchInput, setSearchInput] = useState();

  const handleCreateRoom = async () => {
    setIsCreate(true);
    visibilityRoomInfo.handleMakeVisible();
  };

  return html`
    <section
      className="flex w-full py-[10px] border-b border-[rgba(128,128,128,0.4)] flex-col justify-center items-center"
    >
      <section className="w-[80%] mb-[5px] flex justify-between">
        <${Button}
          variant=${'square'}
          onClick=${handleCreateRoom}
          className=${'w-full'}
        >
          Join/Create Calendar
        </>
      </section>

      <input
        className="mb-0 w-[80%]"
        type="text"
        placeholder="search list"
        onChange=${(e) => setSearchInput(e.target.value)}
      />
    </section>
  `;
};
