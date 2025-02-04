import { html } from 'htm/react';

/**
 * A button component that can be customized with different variants, widths, and additional styles.
 *
 * @param {Object} props - The component props.
 * @param {boolean} [props.isDisabled] - Indicates if the button is disabled and unclickable.
 * @param {Function} [props.onClick] - Callback function executed when the button is clicked.
 * @param {HTMLElement} [props.children] - The content inside the button, typically text or other elements.
 * @param {string} [props.variant] - Choose a style variant (e.g. 'circle' for a circular button).
 * @param {string} [props.width] - Specify the width of the button (e.g. 'wide').
 * @param {string} [props.className] - Additional Tailwind CSS classes for custom styling.
 */
export default ({
  isDisabled,
  onClick,
  children,
  variant,
  width,
  className = '',
}) => {
  const baseClasses = 'flex items-center border border-[rgba(128,128,128,0.4)]';

  const buttonWidth =
    width === 'wide' ? 'w-[120px]' : width === 'none' ? '' : 'w-[80px]';

  const variantClasses =
    variant === 'circle' ? 'w-[30px] rounded-full' : 'justify-center h-[32px]';

  const activeClasses = isDisabled
    ? 'bg-[#3a3d42] border border-black border-inset opacity-80 cursor-default'
    : 'hover:bg-hoverButton';

  return html`
    <button
      className=${`${baseClasses} ${buttonWidth} ${variantClasses} ${activeClasses} ${className} `}
      onClick=${!isDisabled ? onClick : undefined}
    >
      ${children}
    </button>
  `;
};
