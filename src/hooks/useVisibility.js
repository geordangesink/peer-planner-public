import { useState } from 'react';

/**
 * Hook to modify and check visibility of an component
 */
export default () => {
  const [isVisible, setVisible] = useState(false);

  const handleMakeVisible = () => {
    setVisible(true);
  };

  const handleMakeInvisible = () => {
    setVisible(false);
  };

  return {
    isVisible,
    handleMakeVisible,
    handleMakeInvisible,
  };
};
