// Test functions for presence.js
/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
import { should } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import _ from 'underscore';

import Presence from '../presence';

let presenceHelper;
const hadBetter = should();

describe('Presence', () => {
  beforeEach(() => {
    presenceHelper = new Presence();
  });

  describe('Messages', () => {
    it('should push messages to the lobby', () => {
      presenceHelper.addMessage({
        author: 'cesar',
        id: 'msg_123',
        content: 'Hello world',
        type: 'chat',
      }, true);
      presenceHelper.getMessages().get('lobby').size.should.equal(1);
    });

    it('should push messages to table', () => {
      presenceHelper.getMessages().size.should.equal(0);
      presenceHelper.addMessage({
        author: 'cesar',
        id: 'msg_123',
        content: 'Hello world',
        type: 'chat',
      }, false);
      hadBetter.not.exist(presenceHelper.getMessages().get('lobby'));
      presenceHelper.getMessages().get('table').size.should.equal(1);
      presenceHelper.addMessage({
        author: 'bob',
        id: 'msg_234',
        content: 'Hello world back',
        type: 'chat',
      }, false);
      hadBetter.not.exist(presenceHelper.getMessages().get('lobby'));
      presenceHelper.getMessages().get('table').size.should.equal(2);
    });

    it('should throw away old messages', () => {
      for (let i = 0; i < 5; i += 1) {
        presenceHelper.addMessage({
          author: 'cesar',
          id: _.uniqueId('msg_'),
          content: `hello${i}`,
          type: 'chat',
        }, false, 5);
      }
      presenceHelper.getMessages().get('table').size.should.equal(5);
      presenceHelper.getMessages().get('table').get(0).content.should.equal(
        'hello0');
      // Push one more message.
      presenceHelper.addMessage({
        author: 'cesar',
        id: _.uniqueId('msg_'),
        content: 'The penguin of doom!!!',
        type: 'chat',
      }, false, 5);
      // Size should still be 5
      presenceHelper.getMessages().get('table').size.should.equal(5);
      // First message should be gone.
      presenceHelper.getMessages().get('table').get(0).content.should.equal(
        'hello1');
      // Last message should be most recent
      presenceHelper.getMessages().get('table').get(4).content.should.equal(
        'The penguin of doom!!!');
    });
  });

  describe('Users', () => {
    it('should add users to the lobby', () => {
      presenceHelper.addUsers(['cesar', 'bob', 'alice', 'mike'], 'lobby');
      presenceHelper.getUsers().get('lobby').size.should.equal(4);
    });

    it('should add users to a table', () => {
      presenceHelper.addUsers(['cesar', 'john', 'mary'], '1234');
      presenceHelper.getUsers().get('1234').size.should.equal(3);
      // No table exists.
      presenceHelper.getTables().size.should.equal(0);
    });
  });

  describe('Tables', () => {
    beforeEach(() => {
      // XXX: This seems pretty ghetto.
      presenceHelper.tablesToAdd = [
        {
          lexicon: 'foo',
          host: 'bar',
          users: ['cesar', 'michael'],
          wordList: 'the 16s',
          tablenum: 27,
          secondsPerRound: 100,
          questionsPerRound: 50,
        },
        {
          lexicon: 'bar',
          host: 'baz',
          users: ['joshua', 'jackson'],
          wordList: 'the cats',
          tablenum: 45,
          secondsPerRound: 200,
          questionsPerRound: 100,
        },
      ];
    });
    it('should add tables', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.getTables().size.should.equal(2);
      const table = presenceHelper.getTables().get('45');
      table.get('wordList').should.equal('the cats');
      table.get('users').toJS()[0].should.equal('joshua');
    });
    it('should replace users in table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.addUsers(['cesar', 'john', 'mary'], '45');
      const newUsers = presenceHelper.getTables().get('45').get('users');
      newUsers.size.should.equal(3);
      newUsers.toJS()[1].should.equal('john');
      newUsers.toJS()[2].should.equal('mary');
    });
    it('should update existing table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.updateTable({
        lexicon: 'bar',
        host: 'cats',
        users: ['cats'],
        wordList: 'the cats',
        tablenum: 45,
        secondsPerRound: 100,
        questionsPerRound: 10,
      });
      const newUsers = presenceHelper.getTables().get('45').get('users');
      newUsers.size.should.equal(1);
      newUsers.get(0).should.equal('cats');
      presenceHelper.getTables().get('45').get('host').should.equal('cats');
      presenceHelper.getTables().size.should.equal(2);
    });
    it('should add single new table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.updateTable({
        lexicon: 'OWL2',
        host: 'aiur',
        users: ['cesar', 'conditar', 'jesse'],
        wordList: 'OWL2 4s',
        tablenum: 87,
        secondsPerRound: 100,
        questionsPerRound: 10,
      });
      presenceHelper.getTables().get('87').get('users').size.should.equal(3);
      presenceHelper.getTables().size.should.equal(3);
    });

    it('should change the host of a table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.setHost('bernie', '45');
      presenceHelper.getTables().get('45').get('host').should.equal('bernie');
      presenceHelper.getTables().size.should.equal(2);
    });

    it('should ignore change host events for nonexistent tables', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.setHost('bernie', '50');
      hadBetter.not.exist(presenceHelper.getTables().get('50'));
      presenceHelper.getTables().size.should.equal(2);
      presenceHelper.getTables().get('27').get('host').should.equal('bar');
      presenceHelper.getTables().get('45').get('host').should.equal('baz');
    });
  });
});
