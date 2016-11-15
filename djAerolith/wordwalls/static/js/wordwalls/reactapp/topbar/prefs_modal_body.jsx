import React from 'react';
import Immutable from 'immutable';
import _ from 'underscore';

import WordwallsQuestion from '../wordwalls_question';
import Checkbox from '../forms/checkbox';
import TextInput from '../forms/text_input';

class PrefsModalBody extends React.Component {
  /**
   * Calculate the letters that are remaining given a tile order.
   * XXX: We need to fix this for Spanish, I guess.
   * @param  {string} tileOrder
   * @return string
   */
  static calculateLettersRemaining(tileOrder) {
    const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?';
    return _.difference(allLetters.split(''), tileOrder.split('')).join('');
  }

  constructor(props) {
    super(props);
    this.state = {
      letters: 'ADEEMMO?',
      tileOrderLettersRemaining: PrefsModalBody.calculateLettersRemaining(
        this.props.customTileOrder),
      wMap: Immutable.fromJS({
        GAMODEME: {},
        HOMEMADE: {},
      }),
    };
    this.onBlankCharChange = this.onBlankCharChange.bind(this);
    this.onTileOrderChange = this.onTileOrderChange.bind(this);
  }

  onBlankCharChange(event) {
    this.props.onOptionsModify('blankCharacter', event.target.value);
  }

  onTileOrderChange(event) {
    // XXX: Check if it has all letters before setting state. If not,
    // set some sort of indicator.

    const letters = _.uniq(
      event.target.value.toLocaleUpperCase().split('')).join('');
    this.props.onOptionsModify('customTileOrder', letters);
    const remaining = PrefsModalBody.calculateLettersRemaining(letters);
    this.setState({
      tileOrderLettersRemaining: remaining,
    });
    if (remaining.length === 0 || remaining.length === 27) {
      this.props.allowSave(true);
    } else {
      this.props.allowSave(false);
    }
  }

  /**
   * Depending on the value of this.props.tilesOn, different
   * forms must display.
   */
  getTileDependentForm() {
    let formElements;
    if (this.props.tilesOn) {
      formElements = (
        <TextInput
          colSize={2}
          label="Blank Character"
          maxLength={1}
          value={this.props.blankCharacter}
          onChange={this.onBlankCharChange}
          onKeyPress={() => {}}
        />
      );
    } else {
      formElements = (
        <div>
          <Checkbox
            on={this.props.showBold}
            onChange={(event) => {
              this.props.onOptionsModify('showBold', event.target.checked);
            }}
            label="Bold font"
          />
          <Checkbox
            on={this.props.fontSans}
            onChange={(event) => {
              this.props.onOptionsModify('fontSans', event.target.checked);
            }}
            label="Sans-serif font"
          />
        </div>
      );
    }

    return formElements;
  }

  render() {
    const stateLetRem = this.state.tileOrderLettersRemaining;
    let letRem;
    // If it's not totally empty (or not totally full)
    if (stateLetRem.length !== 0 && stateLetRem.length !== 27) {
      letRem = (
        <span
          className="text-danger"
        >
          <strong>{
            `${stateLetRem} (${stateLetRem.length})`
          }</strong></span>);
    } else {
      letRem = (
        <span className="text-success">
          <i
            className="glyphicon glyphicon-ok"
            aria-hidden="true"
          />
        </span>);
    }

    return (
      <div className="modal-body">
        <div className="row">
          <div className="col-lg-12">
            <svg
              width="180"
              height="30"
            >
              <WordwallsQuestion
                letters={this.state.letters}
                qNumber={0}
                words={this.state.wMap}
                gridX={0}
                gridY={0}
                xSize={180}
                ySize={30}
                displayStyle={{
                  on: this.props.tilesOn,
                  customOrder: this.props.customTileOrder,
                  blankCharacter: this.props.blankCharacter,
                  font: this.props.fontSans ? 'sans' : 'mono',
                  showChips: this.props.showChips,
                  bold: this.props.showBold,
                  showBorders: this.props.showBorders,
                }}
                onShuffle={() => {
                  const shuffledLetters = _.shuffle(this.state.letters);
                  this.setState({
                    letters: shuffledLetters,
                  });
                }}
              />
            </svg>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">

            <form>
              <Checkbox
                on={this.props.tilesOn}
                onChange={(event) => {
                  this.props.onOptionsModify(
                    'tilesOn', event.target.checked);
                }}
                label="Show tiles"
              />
              {this.getTileDependentForm()}
              <TextInput
                colSize={6}
                label="Custom Tile Order"
                value={this.props.customTileOrder}
                maxLength={30}
                onChange={this.onTileOrderChange}
                onKeyPress={() => {}}
              />
              <div className="row">
                <div className="col-lg-6">
                  Letters remaining: {letRem}
                </div>
              </div>
              <Checkbox
                on={this.props.showBorders}
                onChange={(event) => {
                  this.props.onOptionsModify('showBorders',
                    event.target.checked);
                }}
                label="Show borders around questions"
              />
              <Checkbox
                on={this.props.showChips}
                onChange={(event) => {
                  this.props.onOptionsModify('showChips',
                    event.target.checked);
                }}
                label="Show number of anagrams"
              />
              <Checkbox
                on={this.props.hideLexiconSymbols}
                onChange={(event) => {
                  this.props.onOptionsModify('hideLexiconSymbols',
                    event.target.checked);
                }}
                label="Hide lexicon symbols (such as # or +)"
              />
            </form>
          </div>
        </div>
      </div>);
  }
}

PrefsModalBody.propTypes = {
  onOptionsModify: React.PropTypes.func,
  tilesOn: React.PropTypes.bool,
  customTileOrder: React.PropTypes.string,
  blankCharacter: React.PropTypes.string,
  fontSans: React.PropTypes.bool,
  showBorders: React.PropTypes.bool,
  showChips: React.PropTypes.bool,
  showBold: React.PropTypes.bool,
  hideLexiconSymbols: React.PropTypes.bool,
  allowSave: React.PropTypes.func,
};

export default PrefsModalBody;
