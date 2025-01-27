import { html } from 'htm/react';

export default ({ isActive = true, onClick, children, className = '' }) => {
  const baseClasses = 'flex items-center justify-center h-[32px] w-[80px]';
  const activeClasses = isActive
    ? 'hover:bg-hoverButton border border-[rgba(128,128,128,0.4)]'
    : 'bg-[#3a3d42] border border-black border-inset opacity-80 cursor-default';

  return html`
    <button
      className=${`${baseClasses} ${activeClasses} ${className}`}
      onClick=${onClick}
    >
      ${children}
    </button>
  `;
};
