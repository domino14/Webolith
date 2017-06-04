/**
 * @fileOverview A container component encapsulating the wordwalls app.
 * Maybe this can be split into smaller components.
 */
import { connect } from 'react-redux';

import WordwallsApp from '../components/wordwalls_app';

const mapStateToProps = (state, ownProps) => {

};

const mapDispatchToProps = (dispatch, ownProps) => {

};

const WordwallsAppContainer = connect(
  mapStateToProps,
  mapDispatchToProps)(WordwallsApp);

export default WordwallsAppContainer;
