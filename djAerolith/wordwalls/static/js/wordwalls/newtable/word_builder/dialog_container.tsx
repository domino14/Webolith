import React, { useState } from 'react';

import Select from '../../forms/select';
import WordwallsAPI from '../../wordwalls_api';

const WORD_BUILDER_URL = '/wordwalls/api/load_word_builder/';

const RACK_LENGTHS = [6, 7, 8, 9];
// Shortest words to find can be up to this many letters shorter than
// the rack.
const MAX_LENGTH_DIFF = 3;
const PUZZLE_COUNTS = [1, 5, 10, 15, 20, 25];

interface WordBuilderDialogContainerProps {
  lexicon: number;
  desiredTime: number;
  tablenum: number;
  onLoadNewList: (data: unknown) => void;
  showSpinner: () => void;
  hideSpinner: () => void;
  notifyError: (error: Error | string) => void;
  api: WordwallsAPI;
  disabled: boolean;
}

function WordBuilderDialogContainer({
  lexicon,
  desiredTime,
  tablenum,
  onLoadNewList,
  showSpinner,
  hideSpinner,
  notifyError,
  api,
  disabled,
}: WordBuilderDialogContainerProps) {
  const [maxLength, setMaxLength] = useState(7);
  const [minLength, setMinLength] = useState(4);
  const [numQuestions, setNumQuestions] = useState(10);

  const minLengthOptions = [];
  for (let l = maxLength - MAX_LENGTH_DIFF; l <= maxLength; l += 1) {
    minLengthOptions.push({ value: String(l), displayValue: String(l) });
  }

  const onMaxLengthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMax = parseInt(e.target.value, 10);
    // Keep the same distance between the rack and shortest word lengths.
    setMinLength(newMax - (maxLength - minLength));
    setMaxLength(newMax);
  };

  const submit = () => {
    showSpinner();
    api
      .call(WORD_BUILDER_URL, {
        lexicon,
        desiredTime,
        tablenum,
        minLength,
        maxLength,
        numQuestions,
      })
      .then((data) => onLoadNewList(data))
      .catch((error) => notifyError(error))
      .finally(() => hideSpinner());
  };

  return (
    <div className="mt-3">
      <p>
        Find every word you can make from a rack of letters, like the daily
        Word Builder challenges. Each round is one rack.
      </p>
      <form>
        <Select
          colSize={4}
          label="Rack length"
          selectedValue={String(maxLength)}
          options={RACK_LENGTHS.map((l) => ({
            value: String(l),
            displayValue: String(l),
          }))}
          onChange={onMaxLengthChange}
        />
        <Select
          colSize={4}
          label="Shortest words to find"
          selectedValue={String(minLength)}
          options={minLengthOptions}
          onChange={(e) => setMinLength(parseInt(e.target.value, 10))}
        />
        <Select
          colSize={4}
          label="Number of racks"
          selectedValue={String(numQuestions)}
          options={PUZZLE_COUNTS.map((n) => ({
            value: String(n),
            displayValue: String(n),
          }))}
          onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
        />
      </form>
      <button
        type="button"
        className="btn btn-primary"
        style={{ marginTop: '0.75em' }}
        onClick={submit}
        data-bs-dismiss="modal"
        disabled={disabled}
      >
        Play
      </button>
    </div>
  );
}

export default WordBuilderDialogContainer;
