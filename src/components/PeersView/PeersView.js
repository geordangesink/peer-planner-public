// TODO: move components to sidebar container
import { html } from "htm/react";
import { useState } from "react";

export default ({ setIsCreate, roomInfoComp }) => {
  const [searchInput, setSearchInput] = useState();

  const handleCreateRoom = async () => {
    setIsCreate(true);
    roomInfoComp.handleMakeVisible();
  };

  return html`
    <section className="peers">
      <section className="join-or-create">
        <button className="button-square" onClick=${handleCreateRoom}>Join/Create Calendar</button>
      </section>

      <input type="text" placeholder="search room" onChange=${(e) => setSearchInput(e.target.value)} />
    </section>
  `;
};
