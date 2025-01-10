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

  return html` <div className="popup-overlay" onClick=${handleOverlayClick}>
    <div className="popup-content" ref=${popupContentRef}>
      <button className="popup-close" onClick=${onClose}>x</button>
      <h2>Activities to change:</h2>
      <form className="form-this-or-all" action="">
        <input
          type="radio"
          id="change-this-activity"
          name="change-activity"
          value="this"
          onChange=${handleRadioChange}
        />
        <label htmlFor="change-this-activity">This Activity</label>

        <input
          type="radio"
          id="change-all-activities"
          name="change-activity"
          value="all"
          onChange=${handleRadioChange}
        />
        <label htmlFor="change-all-activities">All Activities</label>

        ${!isFirstRepeating
          ? html`<input
                type="radio"
                id="change-all-activities"
                name="change-activity"
                value="allFollowing"
                onChange=${handleRadioChange}
              />
              <label htmlFor="change-all-activities">All Following Activities</label>`
          : ""}
      </form>
      <button id="save-this-or-all" className="button-square button-save" onClick=${onSave}>Save</button>
    </div>
  </div>`;
};
