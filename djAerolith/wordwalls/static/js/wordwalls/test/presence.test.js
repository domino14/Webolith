// XXX: NOTE - we don't even use presence.js anymore; we should remove this.
// Test functions for presence.js
/* eslint-disable import/no-extraneous-dependencies, no-unused-expressions */
// import { should } from 'chai';
import _ from 'underscore';

import Presence from '../presence';

let presenceHelper;

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
      expect(presenceHelper.getMessages().get('lobby').size).toBe(1);
    });

    it('should push messages to table', () => {
      expect(presenceHelper.getMessages().size).toBe(0);
      presenceHelper.addMessage({
        author: 'cesar',
        id: 'msg_123',
        content: 'Hello world',
        type: 'chat',
      }, false);
      expect(presenceHelper.getMessages().get('lobby')).toBeFalsy();
      expect(presenceHelper.getMessages().get('table').size).toBe(1);
      presenceHelper.addMessage({
        author: 'bob',
        id: 'msg_234',
        content: 'Hello world back',
        type: 'chat',
      }, false);
      expect(presenceHelper.getMessages().get('lobby')).toBeFalsy();
      expect(presenceHelper.getMessages().get('table').size).toBe(2);
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
      expect(presenceHelper.getMessages().get('table').size).toBe(5);
      expect(presenceHelper.getMessages().get('table').get(0).content).toBe('hello0');
      // Push one more message.
      presenceHelper.addMessage({
        author: 'cesar',
        id: _.uniqueId('msg_'),
        content: 'The penguin of doom!!!',
        type: 'chat',
      }, false, 5);
      // Size should still be 5
      expect(presenceHelper.getMessages().get('table').size).toBe(5);
      // First message should be gone.
      expect(presenceHelper.getMessages().get('table').get(0).content).toBe('hello1');
      // Last message should be most recent
      expect(presenceHelper.getMessages().get('table').get(4).content).toBe('The penguin of doom!!!');
    });
  });

  describe('Users', () => {
    it('should add users to the lobby', () => {
      presenceHelper.addUsers(['cesar', 'bob', 'alice', 'mike'], 'lobby');
      expect(presenceHelper.getUsers().get('lobby').size).toBe(4);
    });

    it('should add users to a table', () => {
      presenceHelper.addUsers(['cesar', 'john', 'mary'], '1234');
      expect(presenceHelper.getUsers().get('1234').size).toBe(3);
      // No table exists.
      expect(presenceHelper.getTables().size).toBe(0);
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
      expect(presenceHelper.getTables().size).toBe(2);
      const table = presenceHelper.getTables().get('45');
      expect(table.get('wordList')).toBe('the cats');
      expect(table.get('users').toJS()[0]).toBe('joshua');
    });
    it('should replace users in table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.addUsers(['cesar', 'john', 'mary'], '45');
      const newUsers = presenceHelper.getTables().get('45').get('users');
      expect(newUsers.size).toBe(3);
      expect(newUsers.toJS()[1]).toBe('john');
      expect(newUsers.toJS()[2]).toBe('mary');
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
      expect(newUsers.size).toBe(1);
      expect(newUsers.get(0)).toBe('cats');
      expect(presenceHelper.getTables().get('45').get('host')).toBe('cats');
      expect(presenceHelper.getTables().size).toBe(2);
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
      expect(presenceHelper.getTables().get('87').get('users').size).toBe(3);
      expect(presenceHelper.getTables().size).toBe(3);
    });

    it('should change the host of a table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.setHost('bernie', '45');
      expect(presenceHelper.getTables().get('45').get('host')).toBe('bernie');
      expect(presenceHelper.getTables().size).toBe(2);
    });

    it('should ignore change host events for nonexistent tables', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.setHost('bernie', '50');
      expect(presenceHelper.getTables().get('50')).toBeFalsy();
      expect(presenceHelper.getTables().size).toBe(2);
      expect(presenceHelper.getTables().get('27').get('host')).toBe('bar');
      expect(presenceHelper.getTables().get('45').get('host')).toBe('baz');
    });

    it('should get the host of a table', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      expect(presenceHelper.getHost('27')).toBe('bar');
    });

    it('should get the host of a table after a change', () => {
      presenceHelper.addTables(presenceHelper.tablesToAdd);
      presenceHelper.setHost('bernie', '45');
      expect(presenceHelper.getHost('45')).toBe('bernie');
    });
  });
});
