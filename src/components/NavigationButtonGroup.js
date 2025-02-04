import { html } from 'htm/react';
import Button from './Button';

/**
 * A component that renders navigation buttons with left and right arrows.
 *
 * @param {Object} props - The component props.
 * @param {Function} [props.onLeftClick] - Callback function executed when the left arrow button is clicked.
 * @param {Function} [props.onRightClick] - Callback function executed when the right arrow button is clicked.
 */
const NavigationButtonGroup = ({ onLeftClick, onRightClick }) => {
  return html`
    <div className="flex items-center">
      <${Button} variant="circle" width='none' onClick=${onLeftClick}>
        <span>${'<'}</span>
      </${Button}>
      <${Button} variant="circle" width='none' onClick=${onRightClick}>
        <span>${'>'}</span>
      </${Button}>
    </div>
  `;
};

export default NavigationButtonGroup;
