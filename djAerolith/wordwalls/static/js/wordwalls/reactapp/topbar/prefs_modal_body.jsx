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
    getInitialState: function() {
      return {
        tilesOn: this.props.displayStyle.tc.on,
        customTileOrder: this.props.displayStyle.tc.customOrder,
        blankCharacter: this.props.displayStyle.tc.blankCharacter,
        font: this.props.displayStyle.tc.font,
        showBorders: this.props.displayStyle.bc.showBorders,
        showChips: this.props.displayStyle.tc.showChips,
        showBold: this.props.displayStyle.tc.bold
      };
    },
    /**
     * Depending on the value of this.state.tilesOn, different
     * forms must display.
     */
    getTileDependentForm: function() {
      var formElements;
      if (this.state.tilesOn) {
        formElements = (
          <TextInput
            colSize={2}
            label="Blank Character"
          />
        );
      } else {
        formElements = (
          <div>
            <Checkbox
              on={this.state.showBold}
              onChange={function() {}}
              label="Bold font" />
            <Checkbox
              on={this.state.font === 'sans'}
              onChange={function() {}}
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
                  displayStyle={this.props.displayStyle.tc}
                  onShuffle={function(){}}
                />
              </svg>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">

              <form>
                <Checkbox
                  on={this.state.tilesOn}
                  onChange={function() {
                    this.setState({
                      tilesOn: !this.state.tilesOn
                    });}.bind(this)
                  }
                  label="Show tiles"/>
                {this.getTileDependentForm()}
                <TextInput
                  colSize={6}
                  label="Custom Tile Order"
                />

                <Checkbox
                  on={this.state.showBorders}
                  onChange={function() {
                    this.setState({
                      showBorders: !this.state.showBorders
                    });}.bind(this)
                  }
                  label="Show borders around questions"/>
                <Checkbox
                  on={this.state.showChips}
                  onChange={function() {
                    this.setState({
                      showChips: !this.state.showChips
                    });}.bind(this)
                  }
                  label="Show color-coded chips"/>

              </form>
            </div>


          </div>
        </div>);
    }
  });

  return ModalBody;
});