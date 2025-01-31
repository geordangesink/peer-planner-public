import { html } from 'htm/react';
import { useState, useEffect } from 'react';

// display window control buttons based on OS
export default () => {
  const [justifyClass, setJustifyClass] = useState('');

  useEffect(() => {
    const isMac = navigator.userAgent.includes('Mac');
    setJustifyClass(isMac ? 'justify-start' : 'justify-end');
  }, []);

  return html` <div
    className="pl-3 w-full h-title-bar fixed p-0 whitespace-nowrap text-white border-b border-gray-400/40 flex items-center"
    style=${{ WebkitAppRegion: 'drag' }}
  >
    <!-- Tailwind margin doesnt work here for some reason -->
    <pear-ctrl
      className=${`flex ${justifyClass} items-center h-title-bar`}
      style=${{ margin: '0 8px' }}
      data-platform="darwin"
    >
    </pear-ctrl>
  </div>`;
};
