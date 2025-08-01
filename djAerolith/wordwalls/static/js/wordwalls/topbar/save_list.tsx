 
import React, { useState, useRef, useEffect } from 'react';

const MAXIMUM_LIST_NAME_SIZE = 50;

interface ListSaveBarProps {
  listName?: string;
  autoSave?: boolean;
  onListNameChange: (name: string) => void;
  onAutoSaveToggle: () => void;
  disableEditing: boolean;
}

function ListSaveBar({
  listName = '',
  autoSave = false,
  onListNameChange,
  onAutoSaveToggle,
  disableEditing,
}: ListSaveBarProps) {
  const [inputEditable, setInputEditable] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when it becomes editable
  useEffect(() => {
    if (inputEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputEditable]);

  const handleEdit = () => {
    setInputEditable(true);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onListNameChange(event.target.value);
  };

  const handleAutoSaveToggle = () => {
    onAutoSaveToggle();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13) {
      setInputEditable(false);
      onListNameChange((e.target as HTMLInputElement).value.trim());
    }
  };

  let listNameStyle: React.CSSProperties;
  let listNameTitle: string;
  let inputStyle: React.CSSProperties;
  let pencilStyle: React.CSSProperties;
  let saveStyle: React.CSSProperties;
  let saveClass = 'hovertip d-block d-md-none';
  let listNameContainerClass: string = '';
  let saveContainerClass: string = '';

  if (inputEditable) {
    listNameStyle = {
      display: 'none',
    };
    pencilStyle = {
      display: 'none',
    };
    saveStyle = {
      display: 'none',
    };
    inputStyle = {};
  } else {
    listNameStyle = {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: 'calc(100% - 5px)',
      display: 'inline-block',
      fontWeight: '500',
    };
    pencilStyle = {
      marginLeft: '5px',
      display: 'inline-block',
      verticalAlign: 'top',
      position: 'relative',
      top: '2px',
    };
    saveStyle = {
      display: 'inline-block',
    };
    inputStyle = {
      display: 'none',
    };
    listNameContainerClass = 'col-8 col-md-9';
    saveContainerClass = 'col-4 col-md-3';
  }

  if (autoSave) {
    saveClass = 'text-success hovertip d-block d-md-none';
  }

  if (disableEditing) {
    pencilStyle = {
      display: 'none',
    };
    saveStyle = {
      display: 'none',
    };
    listNameTitle = 'You cannot change or save a list in a multiplayer table.';
    listNameContainerClass = 'col-12';
    saveContainerClass = 'd-none';
  } else {
    listNameTitle = `This is the name of the word list. You can click the
            pencil to change the name, or the disk icon to toggle autosave.`;
  }

  return (
    <div
      style={{ whiteSpace: 'nowrap' }}
      className="row"
    >
      <div className={listNameContainerClass}>
        <div
          style={listNameStyle}
          className="hovertip"
          data-bs-toggle="tooltip"
          title={listNameTitle}
        >
          {listName}
        </div>
        <div
          className="bi bi-pencil hovertip"
          aria-hidden="true"
          style={pencilStyle}
          data-bs-toggle="tooltip"
          title="Edit the list name"
          onClick={handleEdit}
        />
      </div>

      <div className={saveContainerClass}>
        <div
          className={saveClass}
          style={saveStyle}
          data-bs-toggle="tooltip"
          title="Click to toggle autosave at the end of each round."
          onClick={handleAutoSaveToggle}
        >
          <span
            className="bi bi-hdd"
          />
        </div>
        <div>
          <label
            className="checkbox-inline d-none d-md-inline-block"
            style={saveStyle}
            htmlFor="auto-save-checkbox"
          >
            <input
              type="checkbox"
              id="auto-save-checkbox"
              checked={autoSave}
              onChange={handleAutoSaveToggle}
              value="autoSaveSomething"
            />
            {' '}
            Autosave
          </label>
        </div>
      </div>

      <div className="col-12">
        <input
          type="text"
          className="form-control input-sm"
          style={inputStyle}
          value={listName}
          onChange={handleNameChange}
          onKeyPress={handleKeyPress}
          maxLength={MAXIMUM_LIST_NAME_SIZE}
          ref={inputRef}
        />
      </div>
    </div>
  );
}

export default ListSaveBar;
