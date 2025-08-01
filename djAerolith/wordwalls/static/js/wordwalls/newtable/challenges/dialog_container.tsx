import React, {
  useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef,
} from 'react';
import moment from 'moment';

import ChallengeDialog from './dialog';
import WordwallsAPI from '../../wordwalls_api';

const CHALLENGERS_URL = '/wordwalls/api/challengers/';
const NEW_CHALLENGE_URL = '/wordwalls/api/new_challenge/';
const CHALLENGES_PLAYED_URL = '/wordwalls/api/challenges_played/';
const SPECIAL_CHALLENGES_URL = '/wordwalls/api/special_challenges/';
const DATE_FORMAT_STRING = 'YYYY-MM-DD';

interface ChallengeInfo {
  id: number;
  seconds: number;
  numQuestions: number;
  name: string;
  orderPriority: number;
}

interface Lexicon {
  id: number;
  lexicon: string;
  description: string;
}

interface ChallengeDialogContainerProps {
  challengeInfo: ChallengeInfo[];
  availableLexica: Lexicon[];
  showSpinner: () => void;
  hideSpinner: () => void;
  hideErrors: boolean;
  api: WordwallsAPI;
  setTimeAndQuestions: (params: { desiredTime: string; questionsPerRound: number }) => void;
  tablenum: number;
  onLoadNewList: (data: unknown) => void;
  lexicon: number;
  preSubmitHook: (callback: () => void) => void;
  notifyError: (error: Error | string) => void;
}

export interface ChallengeDialogContainerRef {
  refreshData: () => void;
}

const ChallengeDialogContainer = forwardRef<ChallengeDialogContainerRef, ChallengeDialogContainerProps>(({
  challengeInfo,
  availableLexica,
  showSpinner,
  hideSpinner,
  hideErrors,
  api,
  setTimeAndQuestions,
  tablenum,
  onLoadNewList,
  lexicon,
  preSubmitHook,
  notifyError,
}, ref) => {
  const [currentDate, setCurrentDate] = useState(() => moment());
  const [challengesDoneAtDate, setChallengesDoneAtDate] = useState<{challengeID: number}[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<number>(0);
  const [challengeLeaderboardData, setChallengeLeaderboardData] = useState<object>({});
  const [specialChallengeInfo, setSpecialChallengeInfo] = useState<ChallengeInfo[]>([]);

  // Use memoized date string to prevent unnecessary re-renders
  const currentDateString = useMemo(() => currentDate.format(DATE_FORMAT_STRING), [currentDate]);

  const loadChallengeLeaderboardData = useCallback(() => {
    if (!currentChallenge) {
      return;
    }
    showSpinner();
    api.call(CHALLENGERS_URL, {
      lexicon,
      date: currentDateString,
      challenge: currentChallenge,
      tiebreaker: hideErrors ? 'time' : 'errors',
    }, 'GET')
      .then((data) => setChallengeLeaderboardData(data || {}))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
    // eslint-disable-next-line
  }, [currentChallenge, lexicon, currentDateString, hideErrors]);

  const loadChallengePlayedInfo = useCallback(() => {
    showSpinner();
    api.call(CHALLENGES_PLAYED_URL, {
      lexicon,
      date: currentDateString,
    }, 'GET')
      .then((data) => setChallengesDoneAtDate(data))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
    // eslint-disable-next-line
  }, [lexicon, currentDateString]);

  const loadSpecialChallenges = useCallback(() => {
    showSpinner();
    api.call(SPECIAL_CHALLENGES_URL, {
      lexicon,
      date: currentDateString,
    }, 'GET')
      .then((data) => setSpecialChallengeInfo(data))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
    // eslint-disable-next-line
  }, [lexicon, currentDateString]);

  useEffect(() => {
    loadChallengePlayedInfo();
    loadSpecialChallenges();
  }, [loadChallengePlayedInfo, loadSpecialChallenges]);

  useEffect(() => {
    loadChallengeLeaderboardData();
  }, [loadChallengeLeaderboardData]);

  const onChallengeSelected = (challID: number) => {
    let challenge = challengeInfo.find((c) => c.id === challID);
    if (!challenge) {
      challenge = specialChallengeInfo.find((c) => c.id === challID);
    }
    if (challenge) {
      setCurrentChallenge(challID);
      setTimeAndQuestions({
        desiredTime: String(challenge.seconds / 60),
        questionsPerRound: challenge.numQuestions,
      });
    }
  };

  const challengeSubmit = () => {
    showSpinner();
    api.call(NEW_CHALLENGE_URL, {
      lexicon,
      date: currentDateString,
      challenge: currentChallenge,
      tablenum,
    })
      .then((data) => onLoadNewList(data))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(moment(date));
  };

  const handleChallengeSubmit = () => {
    preSubmitHook(challengeSubmit);
  };

  const handleChallengeSelected = (challID: number) => () => onChallengeSelected(challID);

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      loadChallengePlayedInfo();
      loadSpecialChallenges();
      loadChallengeLeaderboardData();
    },
  }));

  return (
    <ChallengeDialog
      challengeInfo={challengeInfo}
      disabled={currentChallenge === 0}
      currentChallenge={currentChallenge}
      challengesDoneAtDate={challengesDoneAtDate}
      challengeLeaderboardData={challengeLeaderboardData}
      hideErrors={hideErrors}
      specialChallengeInfo={specialChallengeInfo}
      onDateChange={handleDateChange}
      currentDate={currentDate}
      onChallengeSubmit={handleChallengeSubmit}
      onChallengeSelected={handleChallengeSelected}
      lexicon={lexicon}
      availableLexica={availableLexica}
    />
  );
});

ChallengeDialogContainer.displayName = 'ChallengeDialogContainer';

export default ChallengeDialogContainer;
