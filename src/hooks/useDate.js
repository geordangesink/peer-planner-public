import { useContext } from 'react';
import { DateContext } from '../context/DateContext';

export default () => {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDate must be used within a DateProvider');
  }

  return context;
};
