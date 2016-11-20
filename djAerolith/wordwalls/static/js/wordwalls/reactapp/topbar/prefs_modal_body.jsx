import React from 'react';
import Immutable from 'immutable';
import _ from 'underscore';

import WordwallsQuestion from '../wordwalls_question';
import SVGBoard from '../svg_board';
import Checkbox from '../forms/checkbox';
import TextInput from '../forms/text_input';
import Select from '../forms/select';

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

  static getTileStyleOptions() {
    const options = [];
    for (let i = 1; i < 10; i += 1) {
      options.push({
        value: String(i),
        displayValue: `Style ${i}`,
      });
    }
    return options;
  }

  /**
   * Get background options.
   */
  static getBackgroundOptions() {
    return [
      {
        value: '',
        displayValue: 'None',
      }, {
        value: 'pool_table',
        displayValue: 'Green table',
      }, {
        value: 'pink_rice',
        displayValue: 'Pink rice (subtlepatterns.com, CC BY-SA 3.0)',
      }, {
        value: 'scribble_light',
        displayValue: 'Scribble light (subtlepatterns.com, CC BY-SA 3.0)',
      }, {
        value: 'canvas',
        displayValue: 'Canvas (subtlepatterns.com, CC BY-SA 3.0)',
      }, {
        value: 'cork_wallet',
        displayValue: 'Cork wallet (subtlepatterns.com, CC BY-SA 3.0)',
      }, {
        value: 'hexellence',
        displayValue: 'Hexellence (subtlepatterns.com, CC BY-SA 3.0)',
      }, {
        value: 'black_linen',
        displayValue: 'Black Linen (subtlepatterns.com, CC BY-SA 3.0)',
      },
    ];
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
    this.onTileOrderChange = this.onTileOrderChange.bind(this);
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
        <div>
          <Select
            colSize={2}
            label="Tile Style"
            selectedValue={this.props.tileStyle}
            onChange={(event) => {
              this.props.onOptionsModify('tileStyle', event.target.value);
            }}
            options={PrefsModalBody.getTileStyleOptions()}
          />
          <TextInput
            colSize={2}
            label="Blank Character"
            maxLength={1}
            value={this.props.blankCharacter}
            onChange={(event) => {
              this.props.onOptionsModify('blankCharacter', event.target.value);
            }}
            onKeyPress={() => { }}
          />
        </div>
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
          <Select
            colSize={2}
            label="Font"
            selectedValue={this.props.font}
            onChange={(event) => {
              this.props.onOptionsModify('font', event.target.value);
            }}
            options={[
              {
                value: 'sans',
                displayValue: 'Sans-serif',
              }, {
                value: 'mono',
                displayValue: 'Mono-spaced',
              },
            ]}
          />
        </div>
      );
    }

    return formElements;
  }

  render() {
    const stateLetRem = this.state.tileOrderLettersRemaining;
    const questions = [];
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
    questions.push(
      <WordwallsQuestion
        key={1}
        letters={this.state.letters}
        qNumber={0}
        words={this.state.wMap}
        gridX={0}
        gridY={0}
        xSize={180}
        ySize={30}
        displayStyle={{
          tilesOn: this.props.tilesOn,
          tileStyle: this.props.tileStyle,
          customOrder: this.props.customTileOrder,
          blankCharacter: this.props.blankCharacter,
          font: this.props.font,
          showChips: this.props.showChips,
          bold: this.props.showBold,
          showBorders: this.props.showBorders,
        }}
        onShuffle={() => {
          const shuffledLetters = _.shuffle(this.state.letters);
          this.setState({
            letters: ''.join(shuffledLetters),
          });
        }}
      />);

    return (
      <div className="modal-body">
        <div className="row">
          <div className="col-lg-12">
            <SVGBoard
              background={this.props.background}
              width={180}
              height={30}
            >{questions}</SVGBoard>
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
              <hr />
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
              <hr />
              <Select
                colSize={5}
                label="Game board background"
                selectedValue={this.props.background}
                onChange={(event) => {
                  this.props.onOptionsModify('background', event.target.value);
                }}
                options={PrefsModalBody.getBackgroundOptions()}
              />
              <Select
                colSize={5}
                label="Body background"
                selectedValue={this.props.bodyBackground}
                onChange={(event) => {
                  this.props.onOptionsModify('bodyBackground', event.target.value);
                }}
                options={PrefsModalBody.getBackgroundOptions()}
              />
              <hr />
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
  tileStyle: React.PropTypes.string,
  customTileOrder: React.PropTypes.string,
  blankCharacter: React.PropTypes.string,
  font: React.PropTypes.string,
  showBorders: React.PropTypes.bool,
  showChips: React.PropTypes.bool,
  showBold: React.PropTypes.bool,
  background: React.PropTypes.string,
  bodyBackground: React.PropTypes.string,
  hideLexiconSymbols: React.PropTypes.bool,
  allowSave: React.PropTypes.func,
};

export default PrefsModalBody;
