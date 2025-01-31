import { html } from 'htm/react';
import Button from '../../components/Button';
import useSchedule from '../../hooks/useSchedule';
import useActivityState from './useActivityState';
import useIsVisible from '../../hooks/useIsVisible';
import ActivityForm from './ActivityForm';
import CustomRepeat from './CustomRepeat';

export default ({
  onClose,
  requestScheduleChange,
  requestDeleteActivity,
  oldActivityData,
  isCreate,
}) => {
  const { currentSchedule, editCurrentSchedule } = useSchedule();
  // TODO: maybe put in object? (also rn a lot is being passed to the ActivityForm comp, can be optimized)
  const {
    isEvent,
    setIsEvent,
    titleRef,
    fromDateRef,
    fromTimeRef,
    untilDateRef,
    untilTimeRef,
    descriptionRef,
    repeatRef,
    customRepeatRef,
    colorRef,
    notificationRef,
    getActivityObject,
  } = useActivityState();
  const isVisibleCustomRep = useIsVisible();

  const onDelete = () => {
    requestDeleteActivity();
    onClose();
  };

  const onSave = () => {
    const newActivity = getActivityObject(
      oldActivityData && oldActivityData.key
    );
    const updatedSchedule = new Map(currentSchedule);
    if (!isCreate) requestScheduleChange(undefined, newActivity);
    else {
      const [key, value] = newActivity.entries().next().value;
      const existing = updatedSchedule.get(key) || new Map();
      updatedSchedule.set(key, new Map([...existing, ...value]));

      editCurrentSchedule(updatedSchedule);
      console.log(updatedSchedule);
    }
    onClose();
  };

  return html`
    <h3 className="w-full ml-[30px]">
      ${isCreate ? 'Create Activity:' : 'Edit Activity:'}
    </h3>
    <div className="flex w-full flex-row justify-start">
      ${['Event', 'Task'].map(
        (type) => html`
          <${Button}
          variant=${'square'}
            key=${`event-task-${type}`}
            className=${`mb-5 mt-3 mr-3 ${isEvent === (type === 'Event') && 'bg-[rgb(39,39,39)] border-[1px] border-black [border-style:inset]'}`}
            onClick=${() => setIsEvent(type === 'Event')}
          >
            ${type}
          </>
        `
      )}
    </div>
    <${ActivityForm}
      isCreate=${isCreate}
      oldActivityData=${oldActivityData}
      titleRef=${titleRef}
      fromDateRef=${fromDateRef}
      fromTimeRef=${fromTimeRef}
      untilDateRef=${untilDateRef}
      untilTimeRef=${untilTimeRef}
      customRepeatRef=${customRepeatRef}
      descriptionRef=${descriptionRef}
      repeatRef=${repeatRef}
      colorRef=${colorRef}
      notificationRef=${notificationRef}
      isVisibleCustomRep=${isVisibleCustomRep}
    >
    </>
    <${Button}
      variant=${'square'}
      className=${'mt-5'}
      onClick=${onSave}
    >
      Save
    </>
    ${
      !isCreate &&
      html`<${Button}
        variant=${'square'}
        className=${'mt-5'}
        onClick=${onDelete}
      >
        Delete
      </>`
    }
    <${CustomRepeat}
      isVisible=${isVisibleCustomRep.isVisible}
      onCancel=${() => {
        customRepeatRef.current === '' &&
          (repeatRef.current.value = 'no-repeat');
        isVisibleCustomRep.handleMakeInvisible();
      }}
      onSave=${(customRepeat) => {
        customRepeatRef.current = customRepeat;
        isVisibleCustomRep.handleMakeInvisible();
      }}
      title="Custom Repeat"
    />
  `;
};
