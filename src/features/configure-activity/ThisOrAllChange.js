import { html } from 'htm/react';
import { useState } from 'react';

/**
 * UX to decide if all, only the selected, or all following recurrences
 * of a given repeating activity should adapt to the submitted changes.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.onClose] - Callback function executed when closing the component.
 * @param {Function} [props.handleScheduleChange] - Callback function to handle schedule changes for the recurring activity.
 * @param {Function} [props.handleDeleteRepeatActivity] - Callback function to handle deletion of the recurring activity.
 * @param {boolean} [props.isDelete] - Indicates if the operation is a delete request (`true`) or not (`false`).
 * @param {boolean} [props.isFirstRepeating] - Indicates if the activity is the first occurrence in the repeating series.
 */
export default ({
  onClose,
  handleScheduleChange,
  handleDeleteRepeatActivity,
  isDelete,
  isFirstRepeating,
}) => {
  const [selectedValue, setSelectedValue] = useState('');

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

  return html` <h2 className="mb-5">Activities to change:</h2>
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
            <label
              className="transform scale-130 text-center m-2.5"
              htmlFor="change-all-activities"
              >All Following Activities</label
            >`
        : ''}
    </form>
    <button
      id="save-this-or-all"
      className="h-[30px] w-[80px] border border-[rgba(128,128,128,0.4)] m-2.5"
      onClick=${onSave}
    >
      Save
    </button>`;
};
