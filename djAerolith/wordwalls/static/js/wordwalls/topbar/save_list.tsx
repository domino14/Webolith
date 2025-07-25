/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events */
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
  let saveClass = 'hovertip hidden-md hidden-lg';
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
      top: '-4px',
      display: 'inline-block',
    };
    saveStyle = {
      display: 'inline-block',
    };
    inputStyle = {
      display: 'none',
    };
    listNameContainerClass = 'col-xs-10 col-md-8';
    saveContainerClass = 'col-xs-2 col-md-4';
  }

  if (autoSave) {
    saveClass = 'text-success hovertip hidden-md hidden-lg';
  }

  if (disableEditing) {
    pencilStyle = {
      display: 'none',
    };
    saveStyle = {
      display: 'none',
    };
    listNameTitle = 'You cannot change or save a list in a multiplayer table.';
    listNameContainerClass = 'col-xs-12 col-md-12';
    saveContainerClass = 'hidden';
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
          data-toggle="tooltip"
          title={listNameTitle}
        >
          {listName}
        </div>
        <div
          className="glyphicon glyphicon-pencil hovertip"
          aria-hidden="true"
          style={pencilStyle}
          data-toggle="tooltip"
          title="Edit the list name"
          onClick={handleEdit}
        />
      </div>

      <div className={saveContainerClass}>
        <div
          className={saveClass}
          style={saveStyle}
          data-toggle="tooltip"
          title="Click to toggle autosave at the end of each round."
          onClick={handleAutoSaveToggle}
        >
          <span
            className="glyphicon glyphicon-hdd"
          />
        </div>
        <div>
          <label
            className="checkbox-inline hidden-xs hidden-sm"
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

      <div className="col-xs-12">
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
