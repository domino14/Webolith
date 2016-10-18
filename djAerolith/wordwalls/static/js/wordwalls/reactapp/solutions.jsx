define([
  'react'
], function(React) {
  "use strict";
  var Solutions;

  Solutions = React.createClass({
    render: function() {
      var tableRows, wordIdx;
      tableRows = [];
      wordIdx = 0;
      this.props.questions.forEach(function(question) {
        question.get('ws').forEach(function(word) {
          tableRows.push(
            <tr key={wordIdx}>
              <td>{question.get('p')}</td>
              <td>{question.get('a')}</td>
              <td>{word.get('fh')}</td>
              <td>{word.get('w')}</td>
              <td>{word.get('bh')}</td>
              <td>{word.get('d')}</td>
              <td>{}</td>
            </tr>
          );
          wordIdx++;
        });

      }, this);


      console.log('rendering solutions', JSON.stringify(this.props.questions));

      return (
        <div>
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>Probability</th>
                <th>Alphagram</th>
                <th>&lt;</th>
                <th>Word</th>
                <th>&gt;</th>
                <th>Definition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows}
            </tbody>
          </table>
          <div className="row">
            {/* solution stats */}
          </div>
        </div>
      );
    }
  });
  return Solutions;
});