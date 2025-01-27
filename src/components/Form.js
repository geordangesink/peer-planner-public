import { html } from 'htm/react';

export default ({ children, className = '' }) => {
  const baseClasses =
    'flex flex-col justify-center items-start space-y-1 space-x-1 bg-black';

  return html`<form
    className="${`${baseClasses} ${className}`} 
  >
    ${children}
  </form>`;
};
