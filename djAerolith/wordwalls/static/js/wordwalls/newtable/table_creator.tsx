import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';

import { ajaxUtils, ajax, getCsrfToken } from '../ajax_utils';
import ModalSkeleton from '../modal_skeleton';
import Pills from './pills';
import Notifications from '../notifications';
import Sidebar from './sidebar';
import WordwallsAPI from '../wordwalls_api';
import Styling from '../style';

import ChallengeDialogContainer, {
  ChallengeDialogContainerRef,
} from './challenges/dialog_container';
import BlankSearchDialogContainer from './blanks/dialog_container';
import WordSearchDialogContainer from './search/dialog_container';
import SavedListDialog, { PlayOptions } from './saved_list_dialog';
import AerolithListDialog from './aerolith_list_dialog';

import { useClient } from '../connect';
import { Anagrammer } from '../gen/wordsearcher/searcher_connect';

const TAB_PLAY = 'Play';
const TAB_STATS = 'Stats';
const TAB_HISTORY = 'History';
const TAB_LEADERBOARDS = 'Leaderboards';

const LIST_TYPE_CHALLENGE = 'Single-Player Challenges';
const LIST_TYPE_WORDSEARCH = 'Word Search';
const LIST_TYPE_BLANKS = 'Blanks';
const LIST_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const LIST_TYPE_SAVED_LIST = 'My Saved Lists';
const FLASHCARD_URL = '/flashcards/';

const NO_LOAD_WHILE_PLAYING =
  'Please wait until the end of the game to perform that action.';

const NWL23_LEX_ID = 24;
const FISE2_LEX_ID = 10;
const OSPS_LEX_ID = 26;
const COLLINS_24_LEX_ID = 25;
const DEUTSCH_LEX_ID = 17;

const COLLINS_LICENSE_TEXT =
  'Published under license with Collins, an imprint of HarperCollins Publishers Limited';
const NASPA_LICENSE_TEXT = `
NASPA Word List, 2023 Edition (NWL23), © 2023 North American Word Game
Players Association.  All rights reserved.`;
const FISE2_LICENSE_TEXT = `
© 2016 FISE (Federación Internacional de Scrabble en Español).
Reservados Todos Los Derechos.`;
const OSPS_LICENSE_TEXT = `
Copyright 2024 Polska Federacja Scrabble. Used with permission.`;
const DEUTSCH_LICENSE_TEXT = `
The "Scrabble®-Turnierliste" used as the German Lexicon is subject to copyright and related rights of Scrabble® Deutschland e.V.
With the friendly assistance of Gero Illings SuperDic.`;

const DEFAULT_TIME_PER_QUIZ = '5'; // minutes
const DEFAULT_TIME_PER_BLANK_QUIZ = '10';

const notifyError = (error: Error | string) => {
  Notifications.alert('Error', `${error}`);
};

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

interface SavedListsData {
  lists: Array<{
    id: number;
    name: string;
    numCurAlphagrams: number;
    numAlphagrams: number;
    questionIndex: number;
    goneThruOnce: boolean;
    lastSaved: string;
    lastSavedDT: string;
  }>;
  count: number;
  limits: {
    total: number;
    current: number;
  };
}

interface TableCreatorProps {
  defaultLexicon: number;
  setDefaultLexicon: (lexicon: number) => void;
  availableLexica: Lexicon[];
  challengeInfo: ChallengeInfo[];
  tablenum: number;
  onLoadNewList: (data: unknown) => void;
  gameGoing: boolean;
  setLoadingData: (loading: boolean) => void;
  hideErrors: boolean;
  displayStyle: Styling;
}

export interface TableCreatorRef {
  resetDialog: () => void;
  showModal: () => void;
}

interface ModalRef {
  show: () => void;
  dismiss: () => void;
}

interface StatsData {
  today: {
    unique_users: number;
    quizzes_started: number;
    words_solved: number;
  };
  week: {
    totals: {
      unique_users: number;
      quizzes_started: number;
      words_solved: number;
    };
    daily_stats: Array<{
      date: string;
      unique_users: number;
      quizzes_started: number;
      words_solved: number;
    }>;
  };
  total_saved_lists: number;
  timezone: string;
}

function StatsContent() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/wordwalls/api/stats/summary/');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStatsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '50px' }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center" style={{ padding: '50px' }}>
        <h3>Error</h3>
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!statsData) {
    return null;
  }

  const todayStats = statsData.today;
  const weekStats = statsData.week;

  return (
    <div style={{ padding: '20px' }}>
      <h3>Site-wide Statistics</h3>
      <p className="text-muted">All times in {statsData.timezone}</p>

      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Today's Activity</h5>
              <div className="mt-3">
                <h2 className="text-primary">{todayStats.unique_users}</h2>
                <p>Active Users</p>
              </div>
              <div className="mt-3">
                <h2 className="text-success">{todayStats.quizzes_started}</h2>
                <p>Quizzes Started</p>
              </div>
              <div className="mt-3">
                <h2 className="text-info">{todayStats.words_solved}</h2>
                <p>Words Solved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">Last 7 Days</h5>
              <div className="mt-3">
                <h2 className="text-primary">
                  {weekStats.totals.unique_users}
                </h2>
                <p>Unique Users</p>
              </div>
              <div className="mt-3">
                <h2 className="text-success">
                  {weekStats.totals.quizzes_started}
                </h2>
                <p>Total Quizzes</p>
              </div>
              <div className="mt-3">
                <h2 className="text-info">{weekStats.totals.words_solved}</h2>
                <p>Total Words Solved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h5 className="card-title">All Time</h5>
              <div className="mt-3">
                <h2 className="text-warning">{statsData.total_saved_lists}</h2>
                <p>Saved Word Lists</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4>Daily Breakdown (Last 7 Days)</h4>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Active Users</th>
                <th>Quizzes</th>
                <th>Words Solved</th>
              </tr>
            </thead>
            <tbody>
              {weekStats.daily_stats
                .slice()
                .reverse()
                .map(day => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{day.unique_users}</td>
                    <td>{day.quizzes_started}</td>
                    <td>{day.words_solved}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * TableCreator should mostly manage its own state, do its own AJAX queries,
 * etc.. It is mostly an independent app. It will have parallels to
 * WordwallsApp, even though it is a part of it.
 */
const TableCreator = forwardRef<TableCreatorRef, TableCreatorProps>(
  (props, ref) => {
    const { setLoadingData, onLoadNewList } = props;

    // Helper function to extract error message from unknown error
    const getErrorMessage = (
      error: unknown,
      defaultMessage: string
    ): string => {
      if (error && typeof error === 'object') {
        if (
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          if (typeof error.response.data === 'string') {
            return `${defaultMessage}: ${error.response.data}`;
          }
          if (
            error.response.data &&
            typeof error.response.data === 'object' &&
            'error' in error.response.data
          ) {
            return `${defaultMessage}: ${error.response.data.error}`;
          }
        }
      }
      if (error instanceof Error) {
        return `${defaultMessage}: ${error.message}`;
      }
      return defaultMessage;
    };

    /**
     * Redirect to the given URL. This forces the user to leave the table
     * they are currently in.
     */
    const redirectUrl = (url: string) => {
      window.location.href = url;
    };

    const [activeTab, setActiveTab] = useState(TAB_PLAY);
    const [activeListType, setActiveListType] = useState(LIST_TYPE_CHALLENGE);

    const [currentLexicon, setCurrentLexicon] = useState(props.defaultLexicon);

    const [desiredTime, setDesiredTime] = useState(DEFAULT_TIME_PER_QUIZ);
    const [questionsPerRound, setQuestionsPerRound] = useState(50);

    // Aerolith lists
    const [aerolithLists, setAerolithLists] = useState<
      Array<{
        id: number;
        name: string;
        lexicon: string;
        numAlphas: number;
        wordLength: number;
      }>
    >([]);
    const [selectedList, setSelectedList] = useState('');
    // Saved lists
    const [savedLists, setSavedLists] = useState<SavedListsData>({
      lists: [],
      count: 0,
      limits: {
        total: 0,
        current: 0,
      },
    });

    const api = useMemo(() => new WordwallsAPI(), []);
    const wordServerRPC = useClient(Anagrammer);
    const modalRef = useRef<ModalRef>(null);

    const showSpinner = useCallback(() => {
      setLoadingData(true);
    }, [setLoadingData]);

    const hideSpinner = useCallback(() => {
      setLoadingData(false);
    }, [setLoadingData]);

    const loadSavedListInfo = useCallback(async () => {
      showSpinner();
      try {
        const response = await ajaxUtils.get('/base/api/saved_lists/', {
          lexicon_id: currentLexicon,
          order_by: 'modified',
          temp: 0,
          last_saved: 'human',
        });
        setSavedLists(response.data);
      } catch (error) {
        console.error('Error loading saved lists:', error);
      } finally {
        hideSpinner();
      }
    }, [currentLexicon, showSpinner, hideSpinner]);

    const selectedListChange = (listId: string) => {
      setSelectedList(listId);
    };

    const aerolithListSubmit = async () => {
      showSpinner();
      try {
        const response = await ajaxUtils.postJson(
          '/wordwalls/api/load_aerolith_list/',
          {
            lexicon: currentLexicon,
            desiredTime: parseFloat(desiredTime),
            questionsPerRound,
            selectedList,
            tablenum: props.tablenum,
          }
        );
        onLoadNewList(response.data);
      } catch (error: unknown) {
        let errorMessage = 'Failed to load list';
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'data' in error.response
        ) {
          errorMessage += `: ${error.response.data}`;
        } else if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        Notifications.alert('Error', errorMessage);
      } finally {
        hideSpinner();
      }
    };

    const flashcardAerolithListSubmit = async () => {
      showSpinner();
      try {
        const response = await ajaxUtils.post(FLASHCARD_URL, {
          action: 'namedListsFlashcard',
          lexicon: currentLexicon,
          namedList: selectedList,
        });
        redirectUrl(response.data.url);
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to process');
        Notifications.alert('Error', errorMessage);
      } finally {
        hideSpinner();
      }
    };

    const savedListSubmit = async (listID: number, action: string) => {
      showSpinner();
      if (action === PlayOptions.PLAY_DELETE) {
        try {
          await ajax({
            url: `/base/api/saved_list/${listID}`,
            method: 'DELETE',
          });
          // XXX: Probably should do smart updating instead of reloading
          // from the server.
          loadSavedListInfo(); // This will hide when it's over.
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, 'Failed to delete list');
          Notifications.alert('Error', errorMessage);
          hideSpinner();
        }
        return;
      }

      try {
        const response = await ajaxUtils.postJson(
          '/wordwalls/api/load_saved_list/',
          {
            lexicon: currentLexicon,
            desiredTime: parseFloat(desiredTime),
            questionsPerRound,
            selectedList: listID,
            tablenum: props.tablenum,
            listOption: action,
          }
        );
        onLoadNewList(response.data);
        modalRef.current?.dismiss();
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to load list');
        Notifications.alert('Error', errorMessage);
      } finally {
        hideSpinner();
      }
    };

    const flashcardSavedListSubmit = async (listID: number, action: string) => {
      showSpinner();
      try {
        const response = await ajaxUtils.post(FLASHCARD_URL, {
          action,
          lexicon: currentLexicon,
          wordList: listID,
          listOption: '1', // This is a hack to make the form validator pass.
          // This variable has no effect.
          // XXX: This flashcard app is a legacy app and we
          // will hopefully replace it soon.
        });
        redirectUrl(response.data.url);
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to process');
        Notifications.alert('Error', errorMessage);
      } finally {
        hideSpinner();
      }
    };

    const loadAerolithListInfo = useCallback(async () => {
      showSpinner();
      try {
        const response = await ajaxUtils.get('/wordwalls/api/default_lists/', {
          lexicon: currentLexicon,
        });
        const data = response.data;
        setAerolithLists(data);
        setSelectedList(data[0] ? String(data[0].id) : '');
      } catch (error) {
        console.error('Error loading aerolith lists:', error);
      } finally {
        hideSpinner();
      }
    }, [currentLexicon, showSpinner, hideSpinner]);

    const listUpload = async (files: File[]) => {
      const data = new FormData();
      data.append('file', files[0]);
      data.append('lexicon', String(currentLexicon));
      showSpinner();

      try {
        const response = await fetch('/wordwalls/ajax_upload/', {
          method: 'POST',
          body: data,
          headers: {
            'X-CSRFToken': getCsrfToken() || '',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData || `HTTP ${response.status}`);
        }

        await loadSavedListInfo();
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to upload list');
        Notifications.alert('Error', errorMessage);
      } finally {
        hideSpinner();
      }
    };

    const preSubmitHook = (callback: () => void) => {
      if (props.gameGoing) {
        Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
      } else {
        callback();
      }
    };

    const setTimeAndQuestions = (o: {
      desiredTime: string;
      questionsPerRound: number;
    }) => {
      setDesiredTime(o.desiredTime);
      setQuestionsPerRound(o.questionsPerRound);
    };

    const loadInfoForListType = useCallback(
      (option: string) => {
        switch (option) {
          case LIST_TYPE_SAVED_LIST:
            loadSavedListInfo();
            break;

          case LIST_TYPE_AEROLITH_LISTS:
            loadAerolithListInfo();
            break;
          default:
            // ??
            break;
        }
      },
      [loadSavedListInfo, loadAerolithListInfo]
    );

    const handlePillClick = useCallback((option: string) => {
      setActiveListType(option);
      if (option !== LIST_TYPE_CHALLENGE) {
        // Reset the time back to the defaults.
        if (option !== LIST_TYPE_BLANKS) {
          setDesiredTime(DEFAULT_TIME_PER_QUIZ);
          setQuestionsPerRound(50);
        } else {
          setDesiredTime(DEFAULT_TIME_PER_BLANK_QUIZ);
          setQuestionsPerRound(50);
        }
      }
    }, []);

    const handleTabChange = useCallback((tab: string) => {
      setActiveTab(tab);
    }, []);

    const challengeDialogContainerRef =
      useRef<ChallengeDialogContainerRef>(null);

    const handleModalShown = useCallback(() => {
      // Refresh challenge data when modal is shown and we're on the challenges tab
      if (
        activeListType === LIST_TYPE_CHALLENGE &&
        challengeDialogContainerRef.current
      ) {
        challengeDialogContainerRef.current.refreshData();
      }
    }, [activeListType]);

    useImperativeHandle(ref, () => ({
      resetDialog() {
        loadInfoForListType(activeListType);
        if (challengeDialogContainerRef.current) {
          // XXX: This is an anti-pattern, but modals and React don't play
          // 100% well together.
          challengeDialogContainerRef.current.refreshData();
        }
      },
      showModal() {
        modalRef.current?.show();
      },
    }));

    useEffect(() => {
      // If certain fields in the state have changed, we should make
      // some network requests.
      // If the lexicon changes, we have to load new word lists no matter what.
      loadInfoForListType(activeListType);
    }, [currentLexicon, activeListType, loadInfoForListType]);

    const renderLicenseText = () => {
      switch (currentLexicon) {
        case COLLINS_24_LEX_ID:
          return <span>{COLLINS_LICENSE_TEXT}</span>;
        case NWL23_LEX_ID:
          return (
            <span>
              <a
                href="https://www.scrabbleplayers.org/landing/aerolith/"
                target="_blank"
                rel="noreferrer"
              >
                {NASPA_LICENSE_TEXT}
              </a>
            </span>
          );
        case FISE2_LEX_ID:
          return <span>{FISE2_LICENSE_TEXT}</span>;
        case OSPS_LEX_ID:
          return <span>{OSPS_LICENSE_TEXT}</span>;
        case DEUTSCH_LEX_ID:
          return <span>{DEUTSCH_LICENSE_TEXT}</span>;
        default:
          return null;
      }
    };

    const renderStatsContent = () => {
      return <StatsContent />;
    };

    const renderHistoryContent = () => {
      return (
        <div className="text-center" style={{ padding: '50px' }}>
          <h3>History</h3>
          <p className="text-muted">Game history coming soon...</p>
        </div>
      );
    };

    const renderLeaderboardsContent = () => {
      return (
        <div className="text-center" style={{ padding: '50px' }}>
          <h3>Leaderboards</h3>
          <p className="text-muted">Site-wide leaderboards coming soon...</p>
        </div>
      );
    };

    const renderPlayContent = () => {
      let selectedQuizSearchDialog: React.ReactNode;
      switch (activeListType) {
        case LIST_TYPE_CHALLENGE:
          selectedQuizSearchDialog = (
            <ChallengeDialogContainer
              ref={challengeDialogContainerRef}
              tablenum={props.tablenum}
              onLoadNewList={props.onLoadNewList}
              challengeInfo={props.challengeInfo}
              hideErrors={props.hideErrors}
              showSpinner={showSpinner}
              hideSpinner={hideSpinner}
              lexicon={currentLexicon}
              availableLexica={props.availableLexica}
              api={api}
              preSubmitHook={preSubmitHook}
              notifyError={notifyError}
              setTimeAndQuestions={setTimeAndQuestions}
            />
          );
          break;
        case LIST_TYPE_WORDSEARCH:
          selectedQuizSearchDialog = (
            <WordSearchDialogContainer
              tablenum={props.tablenum}
              onLoadNewList={props.onLoadNewList}
              showSpinner={showSpinner}
              hideSpinner={hideSpinner}
              lexicon={currentLexicon}
              desiredTime={parseFloat(desiredTime)}
              questionsPerRound={questionsPerRound}
              notifyError={notifyError}
              redirectUrl={redirectUrl}
              api={api}
              disabled={props.gameGoing}
              darkMode={props.displayStyle.darkMode}
            />
          );

          break;
        case LIST_TYPE_BLANKS:
          selectedQuizSearchDialog = (
            <BlankSearchDialogContainer
              tablenum={props.tablenum}
              onLoadNewList={props.onLoadNewList}
              showSpinner={showSpinner}
              hideSpinner={hideSpinner}
              lexicon={currentLexicon}
              availableLexica={props.availableLexica}
              desiredTime={parseFloat(desiredTime)}
              questionsPerRound={questionsPerRound}
              notifyError={notifyError}
              redirectUrl={redirectUrl}
              api={api}
              wordServerRPC={wordServerRPC}
              disabled={props.gameGoing}
            />
          );
          break;

        case LIST_TYPE_SAVED_LIST:
          selectedQuizSearchDialog = (
            <SavedListDialog
              listOptions={savedLists}
              onListSubmit={(listID, action) =>
                preSubmitHook(() => savedListSubmit(listID, action))
              }
              onListUpload={listUpload}
              onListFlashcard={(listID, action) =>
                preSubmitHook(() => flashcardSavedListSubmit(listID, action))
              }
            />
          );
          break;
        case LIST_TYPE_AEROLITH_LISTS:
          selectedQuizSearchDialog = (
            <AerolithListDialog
              listOptions={aerolithLists}
              selectedList={selectedList}
              onSelectedListChange={selectedListChange}
              onListSubmit={() => preSubmitHook(aerolithListSubmit)}
              onFlashcardSubmit={() =>
                preSubmitHook(flashcardAerolithListSubmit)
              }
            />
          );
          break;
        default:
          selectedQuizSearchDialog = null;
      }
      return (
        <div>
          <Pills
            options={[
              LIST_TYPE_CHALLENGE,
              LIST_TYPE_WORDSEARCH,
              LIST_TYPE_BLANKS,
              LIST_TYPE_AEROLITH_LISTS,
              LIST_TYPE_SAVED_LIST,
            ]}
            activePill={activeListType}
            onPillClick={handlePillClick}
          />
          {selectedQuizSearchDialog}
        </div>
      );
    };

    const renderTabContent = () => {
      switch (activeTab) {
        case TAB_PLAY:
          return renderPlayContent();
        case TAB_STATS:
          return renderStatsContent();
        case TAB_HISTORY:
          return renderHistoryContent();
        case TAB_LEADERBOARDS:
          return renderLeaderboardsContent();
        default:
          return renderPlayContent();
      }
    };

    return (
      <ModalSkeleton
        title="Lobby"
        modalClass="table-modal"
        ref={modalRef}
        size="modal-xl"
        onShown={handleModalShown}
      >
        <div className="modal-body">
          <div className="row">
            <div className="col-sm-2">
              <Sidebar
                tabs={[TAB_PLAY, TAB_STATS /*, TAB_HISTORY, TAB_LEADERBOARDS*/]}
                activeTab={activeTab}
                setTab={handleTabChange}
                currentLexicon={currentLexicon}
                defaultLexicon={props.defaultLexicon}
                availableLexica={props.availableLexica}
                setLexicon={setCurrentLexicon}
                setDefaultLexicon={props.setDefaultLexicon}
                desiredTime={desiredTime}
                setTime={setDesiredTime}
                questionsPerRound={questionsPerRound}
                setQuestionsPerRound={setQuestionsPerRound}
                disabledInputs={activeListType === LIST_TYPE_CHALLENGE}
                showPlaySettings={activeTab === TAB_PLAY}
              />
            </div>
            <div className="col-sm-10">{renderTabContent()}</div>
          </div>
        </div>
        <div className="modal-footer">
          <small style={{ marginRight: 10 }}>{renderLicenseText()}</small>
        </div>
      </ModalSkeleton>
    );
  }
);

TableCreator.displayName = 'TableCreator';

export default TableCreator;
