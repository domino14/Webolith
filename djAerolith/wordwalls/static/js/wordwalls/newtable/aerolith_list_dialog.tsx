import React, { useCallback } from 'react';

import Select from '../forms/select';

interface ListOption {
  name: string;
  lexicon: string;
  numAlphas: number;
  id: number;
  wordLength: number;
}

interface SelectOption {
  value: string;
  displayValue: string;
}

interface AerolithListDialogProps {
  selectedList: string;
  onSelectedListChange: (value: string) => void;
  listOptions: ListOption[];
  onListSubmit: () => void;
  onFlashcardSubmit: () => void;
}

function genOptions(listOptions: ListOption[]): SelectOption[] {
  return listOptions.map((option) => ({
    value: String(option.id),
    displayValue: option.name,
  }));
}

function AerolithListDialog({
  selectedList,
  onSelectedListChange,
  listOptions,
  onListSubmit,
  onFlashcardSubmit,
}: AerolithListDialogProps) {
  const handleSelectChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectedListChange(event.target.value);
  }, [onSelectedListChange]);

  return (
    <div className="row">
      <div className="col-sm-12">
        <Select
          colSize={9}
          numItems={15}
          label="Aerolith Lists"
          selectedValue={selectedList}
          onChange={handleSelectChange}
          options={genOptions(listOptions)}
        />
        <button
          className="btn btn-primary"
          style={{ marginTop: '0.75em' }}
          onClick={onListSubmit}
          data-bs-dismiss="modal"
          type="button"
        >
          Play!
        </button>
        <button
          className="btn btn-info"
          style={{ marginTop: '0.75em', marginLeft: '1em' }}
          onClick={onFlashcardSubmit}
          data-bs-dismiss="modal"
          type="button"
        >
          Flashcard
        </button>
      </div>
    </div>
  );
}

export default AerolithListDialog;
