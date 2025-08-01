import { useState, useEffect } from 'react';
import { 
  getCurrentPacificTime, 
  getTimeUntilNextMidnight, 
  formatCountdown,
  getPacificDateString,
  getMaxPacificDate
} from '../utils/pacificTimeUtils';

/**
 * Hook that provides live Pacific Time that updates every minute
 */
export function usePacificTime() {
  const [pacificTime, setPacificTime] = useState(getCurrentPacificTime);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState(getTimeUntilNextMidnight);

  useEffect(() => {
    const updateTime = () => {
      setPacificTime(getCurrentPacificTime());
      setTimeUntilMidnight(getTimeUntilNextMidnight());
    };

    // Update immediately
    updateTime();
    
    // Then update every minute
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    pacificTime,
    timeUntilMidnight,
    countdownText: formatCountdown(timeUntilMidnight.hours, timeUntilMidnight.minutes),
    dateString: getPacificDateString(pacificTime),
  };
}

/**
 * Hook that tracks when Pacific Time day boundaries are crossed
 */
export function usePacificDayChange(onDayChange?: () => void) {
  const [currentPacificDate, setCurrentPacificDate] = useState(getPacificDateString);

  useEffect(() => {
    const checkDayChange = () => {
      const newDate = getPacificDateString();
      if (newDate !== currentPacificDate) {
        setCurrentPacificDate(newDate);
        onDayChange?.();
      }
    };

    // Check every minute for day changes
    const interval = setInterval(checkDayChange, 60000);
    
    return () => clearInterval(interval);
  }, [currentPacificDate, onDayChange]);

  return currentPacificDate;
}

/**
 * Hook that manages challenge availability based on Pacific Time
 */
export function useChallengeAvailability() {
  const [maxDate, setMaxDate] = useState(getMaxPacificDate);
  const { timeUntilMidnight } = usePacificTime();

  // Update max date when day changes
  usePacificDayChange(() => {
    setMaxDate(getMaxPacificDate());
  });

  const isNextDayAvailable = timeUntilMidnight.totalMinutes === 0;
  const nextChallengeCountdown = isNextDayAvailable 
    ? 'Available now!' 
    : `Available in ${formatCountdown(timeUntilMidnight.hours, timeUntilMidnight.minutes)}`;

  return {
    maxDate,
    isNextDayAvailable,
    nextChallengeCountdown,
    timeUntilMidnight,
  };
}

/**
 * Hook that refreshes data when window regains focus
 */
export function useWindowFocus(onFocus?: () => void) {
  useEffect(() => {
    const handleFocus = () => {
      onFocus?.();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [onFocus]);
}