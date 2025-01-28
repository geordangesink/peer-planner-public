// TODO: move components to sidebar container
import { html } from 'htm/react';
import { useState } from 'react';
import Button from './Button';

export default ({ setIsCreate, roomInfoComp }) => {
  const [searchInput, setSearchInput] = useState();

  const handleCreateRoom = async () => {
    setIsCreate(true);
    roomInfoComp.handleMakeVisible();
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
