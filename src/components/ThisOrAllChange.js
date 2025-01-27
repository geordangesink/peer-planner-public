import { html } from "htm/react";
import { useState, useRef } from "react";

export default ({
  onClose,
  handleScheduleChange,
  handleDeleteRepeatActivity,
  isVisible,
  isDelete,
  isFirstRepeating,
}) => {
  const [selectedValue, setSelectedValue] = useState("");
  const popupContentRef = useRef(null);

  const onSave = () => {
    if (isDelete === true) {
      handleDeleteRepeatActivity(selectedValue);
    } else handleScheduleChange(selectedValue);
    onClose();
  };

  // event handler for radio input changes
  const handleRadioChange = (event) => {
    setSelectedValue(event.target.value);
  };

  // check if the click was outside the popup content
  const handleOverlayClick = (e) => {
    if (popupContentRef.current && !popupContentRef.current.contains(e.target)) {
      onClose();
    }
  };
  if (!isVisible) return;

  return html` <div
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
      <h2 className="mb-5">Activities to change:</h2>
      <form className="flex flex-col mb-2.5" action="">
        <input
          type="radio"
          id="change-this-activity"
          className="transform scale-130 text-center m-2.5"
          name="change-activity"
          value="this"
          onChange=${handleRadioChange}
        />
        <label htmlFor="change-this-activity">This Activity</label>

        <input
          type="radio"
          id="change-all-activities"
          className="transform scale-130 text-center m-2.5"
          name="change-activity"
          value="all"
          onChange=${handleRadioChange}
        />
        <label htmlFor="change-all-activities">All Activities</label>

        ${!isFirstRepeating
          ? html`<input
                type="radio"
                id="change-all-activities"
                className="transform scale-130 text-center m-2.5"
                name="change-activity"
                value="allFollowing"
                onChange=${handleRadioChange}
              />
              <label className="transform scale-130 text-center m-2.5" htmlFor="change-all-activities"
                >All Following Activities</label
              >`
          : ""}
      </form>
      <button
        id="save-this-or-all"
        className="h-[30px] w-[80px] border border-[rgba(128,128,128,0.4)] m-2.5"
        onClick=${onSave}
      >
        Save
      </button>
    </div>
  </div>`;
};
