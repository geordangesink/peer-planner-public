import { useState } from "react";

// checks if component hsould be visible or not
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
