import { html } from 'htm/react';

export default ({ isActive = true, onClick, children, className = '' }) => {
  const baseClasses =
    'flex items-center w-[30px] rounded-full bg-sidebar border-black';
  const activeClasses = isActive
    ? 'hover:bg-hoverButton hover:border'
    : 'bg-[#3a3d42] border border-inset opacity-80 cursor-default';

  return html`
    <button
      className=${`${baseClasses} ${activeClasses} ${className}`}
      onClick=${onClick}
    >
      ${children}
    </button>
  `;
};
