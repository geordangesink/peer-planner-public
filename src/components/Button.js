import { html } from 'htm/react';

export default ({ isDisabled, onClick, children, variant, className = '' }) => {
  const baseClasses = 'flex items-center border border-[rgba(128,128,128,0.4)]';

  const variantClasses =
    variant === 'circle'
      ? 'w-[30px] rounded-full'
      : 'justify-center h-[32px] w-[80px]';

  const activeClasses = isDisabled
    ? 'bg-[#3a3d42] border border-black border-inset opacity-80 cursor-default'
    : 'hover:bg-hoverButton';

  return html`
    <button
      className=${`${baseClasses} ${variantClasses} ${activeClasses} ${className}`}
      onClick=${!isDisabled ? onClick : undefined}
    >
      ${children}
    </button>
  `;
};
