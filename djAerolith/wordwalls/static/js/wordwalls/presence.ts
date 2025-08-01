/**
 * @fileOverview Helper class for dealing with Presence inside game tables,
 * the lobby, etc.
 */
import * as Immutable from 'immutable';

const MAX_MESSAGES = 200;

interface Message {
  [key: string]: unknown;
}

interface User {
  [key: string]: unknown;
}

interface Table {
  tablenum: number;
  host?: string;
  users?: Immutable.List<User>;
  [key: string]: unknown;
}

class Presence {
  private messages: Immutable.Map<string, Immutable.List<Message>>;

  private users: Immutable.Map<string, Immutable.List<User>>;

  private tables: Immutable.Map<string, Immutable.Map<string, unknown>>;

  constructor() {
    // Messages should be a map of lists. Key is either 'lobby' or 'table'
    // We can only be in one table at once, at least inside a front-end session
    this.messages = Immutable.Map();
    // Users is also a map of lists. Key is 'lobby' or table number, value
    // is a list of users for each of those.
    this.users = Immutable.Map();
    // Tables is a map of tables.
    this.tables = Immutable.Map();
  }

  /**
   * Add a message to the messages list.
   * @param message
   * @param isLobby
   */
  addMessage(message: Message, isLobby: boolean, optMaxMessages?: number): void {
    const key = isLobby ? 'lobby' : 'table';
    this.messages = this.messages.update(
      key,
      Immutable.List<Message>(),
      (existingList) => existingList.push(message),
    );
    // Trim the message list.
    let maxMessages = MAX_MESSAGES;
    if (optMaxMessages) {
      maxMessages = optMaxMessages;
    }
    if (this.messages.get(key)!.size > maxMessages) {
      this.messages = this.messages.update(
        key,
        (existingList) => existingList!.shift(),
      );
    }
  }

  /**
   * Idempotently sets the users in the room to the passed-in list.
   * @param users
   * @param room
   */
  addUsers(users: User[], room: string): void {
    const userList = Immutable.fromJS(users) as Immutable.List<User>;
    this.users = this.users.set(room, userList);
    if (room === 'lobby') {
      return;
    }
    // Update the specific table with the list of users.
    if (!this.tables.has(room)) {
      // This can happen rarely, if the user joined notification comes
      // before the table creation notification. Just ignore it if that
      // happens, for now.
      return;
    }
    this.tables = this.tables.update(
      room,
      (existingMap) => existingMap!.set('users', userList),
    );
  }

  /**
   * Set the "host" in the room to the passed-in host.
   * @param host
   * @param room
   */
  setHost(host: string, room: string): void {
    if (!this.tables.has(room)) {
      return;
    }
    this.tables = this.tables.update(
      room,
      (existingMap) => existingMap!.set('host', host),
    );
  }

  /**
   * Get the host for the current room, or an empty string.
   * @param room
   * @return host
   */
  getHost(room: string): string {
    if (!this.tables.has(room)) {
      return '';
    }
    return this.tables.get(room)!.get('host') as string;
  }

  /**
   * Idempotently set tables to the passed in list.
   * @param tables
   * Presence info comes in from the tables object, AND from the users
   * above. It's hard to make it one or the other, because of prune_presences
   * We should update the user presence info in the table in the addUsers
   * function above and hope it's up to date.
   */
  addTables(tables: Table[]): void {
    const tableObj: Record<string, Table> = {};
    tables.forEach((table) => {
      tableObj[table.tablenum] = table;
    });
    // XXX: Note that this turns the keys in this.tables into strings.
    this.tables = Immutable.fromJS(tableObj) as Immutable.Map<
      string,
      Immutable.Map<string, unknown>
    >;
  }

  /**
   * Add table to existing lists of tables, or idempotently update table
   * already there.
   * @param table
   */
  updateTable(table: Table): void {
    this.tables = this.tables.set(
      String(table.tablenum),
      Immutable.fromJS(table) as Immutable.Map<string, unknown>,
    );
  }

  getMessages(): Immutable.Map<string, Immutable.List<Message>> {
    return this.messages;
  }

  getUsers(): Immutable.Map<string, Immutable.List<User>> {
    return this.users;
  }

  getTables(): Immutable.Map<string, Immutable.Map<string, unknown>> {
    return this.tables;
  }
}

export default Presence;
