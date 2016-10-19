define([
  'react',
  'jsx!reactapp/wordwalls_question',
  'jsx!reactapp/forms/checkbox',
  'jsx!reactapp/forms/text_input',
  'immutable',
  'underscore'
], function(React, WordwallsQuestion, Checkbox, TextInput, Immutable, _) {
  "use strict";

  var ModalBody;

  ModalBody = React.createClass({
    getInitialState: function() {
      return {
        letters: 'ADEEMMO?',
        tileOrderLettersRemaining: this.calculateLettersRemaining(
          this.props.customTileOrder),
        wMap: Immutable.fromJS({'GAMODEME': {}, 'HOMEMADE': {}})
      };
    },

    /**
     * Calculate the letters that are remaining given a tile order.
     * XXX: We need to fix this for Spanish, I guess.
     * @param  {string} tileOrder
     * @return string
     */
    calculateLettersRemaining: function(tileOrder) {
      var allLetters;
      allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?';
      return _.difference(allLetters.split(''), tileOrder.split('')).join('');

    },

    onBlankCharChange: function(event) {
      this.props.onOptionsModify('blankCharacter', event.target.value);
    },

    onTileOrderChange: function(event) {
      // XXX: Check if it has all letters before setting state. If not,
      // set some sort of indicator.
      var letters, remaining;
      letters = _.uniq(
        event.target.value.toLocaleUpperCase().split('')).join('');
      this.props.onOptionsModify('customTileOrder', letters);
      remaining = this.calculateLettersRemaining(letters);
      this.setState({
        tileOrderLettersRemaining: remaining
      });
      if (remaining.length === 0 || remaining.length === 27) {
        this.props.allowSave(true);
      } else {
        this.props.allowSave(false);
      }
    },

    componentWillReceiveProps: function() {
      console.log('component will receive props');
    },

    componentWillUnmount: function() {
      console.log('component will unmount');
    },

    componentDidMount: function() {
      console.log('component did mount');
    },
    /**
     * Depending on the value of this.props.tilesOn, different
     * forms must display.
     */
    getTileDependentForm: function() {
      var formElements;
      if (this.props.tilesOn) {
        formElements = (
          <TextInput
            colSize={2}
            label="Blank Character"
            maxLength={1}
            value={this.props.blankCharacter}
            onChange={this.onBlankCharChange}
            onKeyPress={function(){}}
          />
        );
      } else {
        formElements = (
          <div>
            <Checkbox
              on={this.props.showBold}
              onChange={function(event) {
                this.props.onOptionsModify('showBold', event.target.checked);
              }.bind(this)}
              label="Bold font" />
            <Checkbox
              on={this.props.fontSans}
              onChange={function(event) {
                this.props.onOptionsModify('fontSans', event.target.checked);
              }.bind(this)}
              label="Sans-serif font" />
          </div>
        );
      }

      return formElements;
    },

    render: function() {
      var letRem, stateLetRem;
      stateLetRem = this.state.tileOrderLettersRemaining;
      // If it's not totally empty (or not totally full)
      if (stateLetRem.length !== 0 && stateLetRem.length !== 27) {
        letRem = (
          <span
            className="text-danger">
            <strong>{
              `${stateLetRem} (${stateLetRem.length})`
            }</strong></span>);
      } else {
        letRem = (
          <span className="text-success">
            <i className="fa fa-check-circle"
              aria-hidden="true"></i>
          </span>);
      }


      return (
        <div className="modal-body">
          <div className="row">
            <div className="col-lg-12">
              <svg
                width="180"
                height="30">
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
                    showBorders: this.props.showBorders
                  }}
                  onShuffle={function(){
                    var letters = this.state.letters;
                    letters = _.shuffle(letters);
                    this.setState({
                      letters: letters
                    });
                  }.bind(this)}
                />
              </svg>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">

              <form>
                <Checkbox
                  on={this.props.tilesOn}
                  onChange={function(event) {
                    this.props.onOptionsModify(
                      'tilesOn', event.target.checked);
                  }.bind(this)}
                  label="Show tiles"/>
                {this.getTileDependentForm()}
                <TextInput
                  colSize={6}
                  label="Custom Tile Order"
                  value={this.props.customTileOrder}
                  maxLength={30}
                  onChange={this.onTileOrderChange}
                  onKeyPress={function(){}}
                />
                <div className="row">
                  <div className="col-lg-6">
                    Letters remaining: {letRem}
                  </div>
                </div>
                <Checkbox
                  on={this.props.showBorders}
                  onChange={function(event) {
                    this.props.onOptionsModify('showBorders',
                      event.target.checked);
                  }.bind(this)}
                  label="Show borders around questions"/>
                <Checkbox
                  on={this.props.showChips}
                  onChange={function(event) {
                    this.props.onOptionsModify('showChips',
                      event.target.checked);
                  }.bind(this)}
                  label="Show number of anagrams"/>
                <Checkbox
                  on={this.props.hideLexiconSymbols}
                  onChange={function(event) {
                    this.props.onOptionsModify('hideLexiconSymbols',
                      event.target.checked);
                  }.bind(this)}
                  label="Hide lexicon symbols (such as # or +)"/>

              </form>
            </div>


          </div>
        </div>);
    }
  });

  return ModalBody;
});