/**
 * @fileOverview The reducer that combines all the reducers.
 */


/** Things in state tree

  For the actual game itself:

    gameGoing
    initial game time
    lists of questions -- original and current

    total words
    lists of answers to current game, who answered them
    last guess and its correctness
    challenge data

    displayStyle
    numberOfRounds
    windowHeight/width
    tablenum

  Presence:

    -- note these probably share info
    lists of messages in lobby and table
    lists of users in lobby and current table
    lists of tables with users, table info in them
    --

  Persistence:

  listNAme
  autoSave

  Other:

  loadingData
 */

import { combineReducers } from 'redux';

const wordwallsApp = combineReducers({
  todos,
  visibilityFilter
});

export default wordwallsApp;