import React, { useCallback, useEffect } from 'react';

import $ from 'jquery';
import Dropzone, { FileRejection } from 'react-dropzone';

import Notifications from '../notifications';
import ListTable from './list_table';

const PlayOptions = {
  FLASHCARD_ENTIRE: 'savedListsFlashcardEntire',
  FLASHCARD_FIRST_MISSED: 'savedListsFlashcardFM',
  PLAY_CONTINUE: 'continue',
  PLAY_FIRST_MISSED: 'firstmissed',
  PLAY_START_OVER: 'startover',
  PLAY_DELETE: 'delete',
} as const;

interface SavedList {
  id: number;
  name: string;
  numCurAlphagrams: number;
  numAlphagrams: number;
  questionIndex: number;
  goneThruOnce: boolean;
  lastSaved: string;
  lastSavedDT: string;
}

interface ListOptions {
  lists: SavedList[];
  count: number;
  limits: {
    total: number;
    current: number;
  };
}

interface SavedListDialogProps {
  listOptions: ListOptions;
  onListSubmit: (listId: number, action: string) => void;
  onListFlashcard: (listId: number, action: string) => void;
  onListUpload: (files: File[]) => void;
}

function SavedListDialog({
  listOptions,
  onListSubmit,
  onListFlashcard,
  onListUpload,
}: SavedListDialogProps) {
  useEffect(() => {
    $('.hovertip').tooltip({ placement: 'auto' });
  }, []); // Run only once on mount

  const onDrop = useCallback((files: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      const error = rejected[0].errors[0];
      if (error.code === 'file-too-large') {
        Notifications.alert('Upload error', 'File is too large. Maximum file size is 1MB.');
      } else {
        Notifications.alert('Upload error', error.message);
      }
    } else {
      onListUpload(files);
    }
  }, [onListUpload]);

  // For most of the following, confirm that the user actually wants to
  // do this action.
  const continueList = useCallback((listID: number) => {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to continue this list? You will lose any
      unsaved progress on your current lists.`,
      () => onListSubmit(listID, PlayOptions.PLAY_CONTINUE),
    );
  }, [onListSubmit]);

  const playFirstMissed = useCallback((listID: number) => {
    Notifications.confirm(
      'Are you sure?',
      'Are you sure you wish to quiz on first missed? This will reset the list.',
      () => onListSubmit(listID, PlayOptions.PLAY_FIRST_MISSED),
    );
  }, [onListSubmit]);

  const resetStartOver = useCallback((listID: number) => {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to start over?
      You will lose all data (including first missed) for this list!`,
      () => onListSubmit(listID, PlayOptions.PLAY_START_OVER),
    );
  }, [onListSubmit]);

  const deleteList = useCallback((listID: number) => {
    Notifications.confirm(
      'Are you sure?',
      'Do you wish to delete this list for good? It can not be recovered!',
      () => onListSubmit(listID, PlayOptions.PLAY_DELETE),
    );
  }, [onListSubmit]);

  const flashcardList = useCallback((listID: number) => {
    onListFlashcard(listID, PlayOptions.FLASHCARD_ENTIRE);
  }, [onListFlashcard]);

  const flashcardFirstMissed = useCallback((listID: number) => {
    onListFlashcard(listID, PlayOptions.FLASHCARD_FIRST_MISSED);
  }, [onListFlashcard]);

  const listInfo = `You currently have ${listOptions.limits.current}
    alphagrams all over your lists. `;
  let limitInfo = '';
  if (listOptions.limits.total !== 0) {
    limitInfo = `Your limit is ${listOptions.limits.total}.`;
  }

  return (
    <div className="row">
      <div className="col-sm-11">
        <div className="row">
          <div className="col-sm-12">
            <p>
              Please select a list from below. Lists that are highlighted
              in
              {' '}
              <span className="bg-success">green</span>
              {' '}
              have already
              been played through once.
            </p>
            <p>
              {listInfo}
              {limitInfo}
            </p>
          </div>
        </div>

        {/* XXX: position: 'relative' is required here in order to get the
        play button to position its dropdown correctly (it uses offsetParent).
        this is an unfortunate hack, open to suggestions.
        see play_button.jsx */}

        <div
          className="row table-scroller"
          style={{ height: 350, overflow: 'scroll', position: 'relative' }}
        >
          <ListTable
            lists={listOptions.lists}
            continueList={continueList}
            playFirstMissed={playFirstMissed}
            resetStartOver={resetStartOver}
            deleteList={deleteList}
            flashcardList={flashcardList}
            flashcardFirstMissed={flashcardFirstMissed}
          />
        </div>
        <div className="row">
          <div className="col-sm-12">
            <p>
              You can also upload your own list below. The list
              must be a text file that consists of just words, one per line.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12">
            <Dropzone
              onDrop={onDrop}
              maxFiles={1}
              maxSize={1000000}
              minSize={2}
            >
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <p>Drag and drop a file here, or click to select files</p>
                  </div>
                </section>
              )}
            </Dropzone>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedListDialog;
export { PlayOptions };
