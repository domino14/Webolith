/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';

import $ from 'jquery';

import ModalSkeleton from '../modal_skeleton';
import Pills from './pills';
import Notifications from '../notifications';
import Sidebar from './sidebar';
import WordwallsAPI from '../wordwalls_api';

import ChallengeDialogContainer from './challenges/dialog_container';
import BlankSearchDialogContainer from './blanks/dialog_container';
import WordSearchDialogContainer from './search/dialog_container';
import SavedListDialog, { PlayOptions } from './saved_list_dialog';
import AerolithListDialog from './aerolith_list_dialog';

import { useClient } from '../connect';
import { Anagrammer } from '../gen/wordsearcher/searcher_connect';

const GAME_TYPE_NEW = 'Load New List';
const LIST_TYPE_CHALLENGE = 'Single-Player Challenges';
const LIST_TYPE_WORDSEARCH = 'Word Search';
const LIST_TYPE_BLANKS = 'Blanks';
const LIST_TYPE_AEROLITH_LISTS = 'Aerolith Lists';
const LIST_TYPE_SAVED_LIST = 'My Saved Lists';
const FLASHCARD_URL = '/flashcards/';

const NO_LOAD_WHILE_PLAYING = (
  'Please wait until the end of the game to perform that action.');

const NWL23_LEX_ID = 24;
const FISE2_LEX_ID = 10;
const OSPS_LEX_ID = 26;
const COLLINS_24_LEX_ID = 25;
const DEUTSCH_LEX_ID = 17;

const COLLINS_LICENSE_TEXT = 'Published under license with Collins, an imprint of HarperCollins Publishers Limited';
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
}

export interface TableCreatorRef {
  resetDialog: () => void;
  showModal: () => void;
}

interface ChallengeDialogContainerRef {
  loadChallengePlayedInfo: () => void;
  loadChallengeLeaderboardData: () => void;
}

interface ModalRef {
  show: () => void;
  dismiss: () => void;
}

/**
 * TableCreator should mostly manage its own state, do its own AJAX queries,
 * etc.. It is mostly an independent app. It will have parallels to
 * WordwallsApp, even though it is a part of it.
 */
const TableCreator = forwardRef<TableCreatorRef, TableCreatorProps>((props, ref) => {
  /**
   * Redirect to the given URL. This forces the user to leave the table
   * they are currently in.
   */
  const redirectUrl = (url: string) => {
    window.location.href = url;
  };

  const [activeGameType, setActiveGameType] = useState(GAME_TYPE_NEW);
  const [activeListType, setActiveListType] = useState(LIST_TYPE_CHALLENGE);

  const [currentLexicon, setCurrentLexicon] = useState(props.defaultLexicon);

  const [desiredTime, setDesiredTime] = useState(DEFAULT_TIME_PER_QUIZ);
  const [questionsPerRound, setQuestionsPerRound] = useState(50);

  // Aerolith lists
  const [aerolithLists, setAerolithLists] = useState<Array<{
    id: number;
    name: string;
    lexicon: string;
    numAlphas: number;
    wordLength: number;
  }>>([]);
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
    props.setLoadingData(true);
  }, [props.setLoadingData]);

  const hideSpinner = useCallback(() => {
    props.setLoadingData(false);
  }, [props.setLoadingData]);

  const loadSavedListInfo = useCallback(() => {
    showSpinner();
    $.ajax({
      url: '/base/api/saved_lists/',
      data: {
        lexicon_id: currentLexicon,
        order_by: 'modified',
        temp: 0,
        last_saved: 'human',
      },
      method: 'GET',
    })
      .done((data) => setSavedLists(data))
      .always(() => hideSpinner());
  }, [currentLexicon, showSpinner, hideSpinner]);

  const selectedListChange = (listId: string) => {
    setSelectedList(listId);
  };

  const aerolithListSubmit = () => {
    showSpinner();
    $.ajax({
      url: '/wordwalls/api/load_aerolith_list/',
      data: JSON.stringify({
        lexicon: currentLexicon,
        desiredTime: parseFloat(desiredTime),
        questionsPerRound,
        selectedList,
        tablenum: props.tablenum,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done((data) => props.onLoadNewList(data))
      .fail((jqXHR) => Notifications.alert(
        'Error',
        `Failed to load list: ${jqXHR.responseJSON}`,
      ))
      .always(() => hideSpinner());
  };

  const flashcardAerolithListSubmit = () => {
    showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action: 'namedListsFlashcard',
        lexicon: currentLexicon,
        namedList: selectedList,
      },
    })
      .done((data) => redirectUrl(data.url))
      .fail((jqXHR) => Notifications.alert(
        'Error',
        `Failed to process: ${jqXHR.responseJSON.error}`,
      ))
      .always(() => hideSpinner());
  };

  const savedListSubmit = (listID: number, action: string) => {
    showSpinner();
    if (action === PlayOptions.PLAY_DELETE) {
      $.ajax({
        url: `/base/api/saved_list/${listID}`,
        method: 'DELETE',
      })
        // XXX: Probably should do smart updating instead of reloading
        // from the server.
        .done(() => loadSavedListInfo()) // This will hide when it's over.
        .fail((jqXHR) => {
          Notifications.alert(
            'Error',
            `Failed to delete list: ${jqXHR.responseJSON}`,
          );
          hideSpinner();
        });
      return;
    }
    $.ajax({
      url: '/wordwalls/api/load_saved_list/',
      data: JSON.stringify({
        lexicon: currentLexicon,
        desiredTime: parseFloat(desiredTime),
        questionsPerRound,
        selectedList: listID,
        tablenum: props.tablenum,
        listOption: action,
      }),
      contentType: 'application/json; charset=utf-8',
      method: 'POST',
    })
      .done((data) => {
        props.onLoadNewList(data);
        modalRef.current?.dismiss();
      })
      .fail((jqXHR) => Notifications.alert(
        'Error',
        `Failed to load list: ${jqXHR.responseJSON}`,
      ))
      .always(() => hideSpinner());
  };

  const flashcardSavedListSubmit = (listID: number, action: string) => {
    showSpinner();
    $.ajax({
      url: FLASHCARD_URL,
      method: 'POST',
      data: {
        action,
        lexicon: currentLexicon,
        wordList: listID,
        listOption: '1', // This is a hack to make the form validator pass.
        // This variable has no effect.
        // XXX: This flashcard app is a legacy app and we
        // will hopefully replace it soon.
      },
    })
      .done((data) => redirectUrl(data.url))
      .fail((jqXHR) => Notifications.alert(
        'Error',
        `Failed to process: ${jqXHR.responseJSON.error}`,
      ))
      .always(() => hideSpinner());
  };

  const loadAerolithListInfo = useCallback(() => {
    showSpinner();
    $.ajax({
      url: '/wordwalls/api/default_lists/',
      data: {
        lexicon: currentLexicon,
      },
      method: 'GET',
    })
      .done((data) => {
        setAerolithLists(data);
        setSelectedList(data[0] ? String(data[0].id) : '');
      })
      .always(() => hideSpinner());
  }, [currentLexicon, showSpinner, hideSpinner]);

  const listUpload = (files: File[]) => {
    const data = new FormData();
    data.append('file', files[0]);
    data.append('lexicon', String(currentLexicon));
    showSpinner();
    $.ajax({
      url: '/wordwalls/ajax_upload/',
      method: 'POST',
      data,
      processData: false,
      contentType: false,
    })
      .done(() => loadSavedListInfo())
      .fail((jqXHR) => Notifications.alert(
        'Error',
        `Failed to upload list: ${jqXHR.responseJSON}`,
      ))
      .always(() => hideSpinner());
  };

  const preSubmitHook = (callback: () => void) => {
    if (props.gameGoing) {
      Notifications.alert('Error', NO_LOAD_WHILE_PLAYING);
    } else {
      callback();
    }
  };

  const setTimeAndQuestions = (o: { desiredTime: string; questionsPerRound: number }) => {
    setDesiredTime(o.desiredTime);
    setQuestionsPerRound(o.questionsPerRound);
  };

  const loadInfoForListType = useCallback((option: string) => {
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
  }, [loadSavedListInfo, loadAerolithListInfo]);

  const challengeDialogContainerRef = useRef<ChallengeDialogContainerRef>(null);

  useImperativeHandle(ref, () => ({
    resetDialog() {
      loadInfoForListType(activeListType);
      if (challengeDialogContainerRef.current) {
        // XXX: This is an anti-pattern, but modals and React don't play
        // 100% well together.
        challengeDialogContainerRef.current.loadChallengePlayedInfo();
        challengeDialogContainerRef.current.loadChallengeLeaderboardData();
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
        return (<span>{COLLINS_LICENSE_TEXT}</span>);
      case NWL23_LEX_ID:
        return (<span><a href="https://www.scrabbleplayers.org/landing/aerolith/" target="_blank" rel="noreferrer">{NASPA_LICENSE_TEXT}</a></span>);
      case FISE2_LEX_ID:
        return (<span>{FISE2_LICENSE_TEXT}</span>);
      case OSPS_LEX_ID:
        return (<span>{OSPS_LICENSE_TEXT}</span>);
      case DEUTSCH_LEX_ID:
        return (<span>{DEUTSCH_LICENSE_TEXT}</span>);
      default:
        return null;
    }
  };

  const renderQuizSearch = () => {
    let selectedQuizSearchDialog: React.ReactNode;
    switch (activeListType) {
      case LIST_TYPE_CHALLENGE:
        selectedQuizSearchDialog = (
          <ChallengeDialogContainer
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
            onListSubmit={(listID, action) => preSubmitHook(
              () => savedListSubmit(listID, action),
            )}
            onListUpload={listUpload}
            onListFlashcard={(listID, action) => preSubmitHook(
              () => flashcardSavedListSubmit(listID, action),
            )}
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
            onFlashcardSubmit={() => preSubmitHook(flashcardAerolithListSubmit)}
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
          onPillClick={(option) => () => {
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
            // loadInfoForListType will be called by useEffect when activeListType changes
          }}
        />
        {selectedQuizSearchDialog}
      </div>
    );
  };

  return (
    <ModalSkeleton
      title="Lobby"
      modalClass="table-modal"
      ref={modalRef}
      size="modal-xl"
    >
      <div className="modal-body">
        <div className="row">
          <div className="col-sm-2">
            <Sidebar
              gameTypes={[GAME_TYPE_NEW]}
              activeGameType={activeGameType}
              setGameType={(option) => setActiveGameType(option)}
              currentLexicon={currentLexicon}
              defaultLexicon={props.defaultLexicon}
              availableLexica={props.availableLexica}
              setLexicon={setCurrentLexicon}
              setDefaultLexicon={props.setDefaultLexicon}
              desiredTime={desiredTime}
              setTime={setDesiredTime}
              questionsPerRound={questionsPerRound}
              setQuestionsPerRound={setQuestionsPerRound}
              disabledInputs={
                activeListType === LIST_TYPE_CHALLENGE
              }
            />
          </div>
          <div className="col-sm-10">
            {renderQuizSearch()}
          </div>

        </div>
      </div>
      <div className="modal-footer">
        <small
          style={{ marginRight: 10 }}
        >
          {renderLicenseText()}
        </small>
      </div>
    </ModalSkeleton>
  );
});

TableCreator.displayName = 'TableCreator';

export default TableCreator;
