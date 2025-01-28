import { html } from 'htm/react';
import Button from './Button';

const NavigationButtonGroup = ({ onLeftClick, onRightClick }) => {
  return html`
    <div className="flex items-center">
      <${Button} variant="circle" onClick=${onLeftClick}>
        <span>${'<'}</span>
      </${Button}>
      <${Button} variant="circle" onClick=${onRightClick}>
        <span>${'>'}</span>
      </${Button}>
    </div>
  `;
};

export default NavigationButtonGroup;
