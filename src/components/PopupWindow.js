import { html } from 'htm/react';
import { useRef } from 'react';

export default ({ widthPx, heightPx, isVisible, onClose, children }) => {
  const popupContentRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (
      popupContentRef.current &&
      !popupContentRef.current.contains(e.target)
    ) {
      onClose(e);
    }
  };

  if (!isVisible) return null;

  return html`
    <div
      className="fixed inset-0 w-full h-full bg-black/50 flex items-center justify-center z-[1000]"
      onClick=${handleOverlayClick}
    >
      <div
        className="bg-black border border-gray-400/40 p-5 rounded relative shadow-lg flex flex-col items-center justify-center"
        style=${{ width: `${widthPx}px`, height: `${heightPx}px` }}
        ref=${popupContentRef}
      >
        <button
          className="absolute top-[10px] right-[10px] text-[1.5rem] border-none bg-none cursor-pointer"
          onClick=${onClose}
        >
          x
        </button>
        ${children}
      </div>
    </div>
  `;
};
