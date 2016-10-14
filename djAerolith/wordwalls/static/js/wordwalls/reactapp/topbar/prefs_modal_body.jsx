define([
  'react',
  'jsx!reactapp/wordwalls_question',
  'jsx!reactapp/forms/checkbox',
  'jsx!reactapp/forms/text_input',
  'immutable'
], function(React, WordwallsQuestion, Checkbox, TextInput, Immutable) {
  "use strict";

  var ModalBody;

  ModalBody = React.createClass({
    onBlankCharChange: function(event) {
      this.props.onOptionsModify('blankCharacter', event.target.value);
    },

    onTileOrderChange: function(event) {
      // XXX: Check if it has all letters before setting state. If not,
      // set some sort of indicator.
      this.props.onOptionsModify('customTileOrder', event.target.value);
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
      var wMap, letters;
      wMap = {
        'GAMODEME': {},
        'HOMEMADE': {}
      };
      wMap = Immutable.fromJS(wMap);
      // letters should be in the state if we want to shuffle here.
      letters = 'ADEEMMO?';

      return (
        <div className="modal-body">
          <div className="row">
            <div className="col-lg-12">
              <svg
                width="180"
                height="30">
                <WordwallsQuestion
                  letters={letters}
                  qNumber={0}
                  words={wMap}
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
                  onShuffle={function(){}}
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
                  maxLength={30}
                  onChange={this.onTileOrderChange}
                  onKeyPress={function(){}}
                />

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
                  label="Show color-coded chips"/>

              </form>
            </div>


          </div>
        </div>);
    }
  });

  return ModalBody;
});