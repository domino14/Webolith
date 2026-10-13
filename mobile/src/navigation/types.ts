export type RootStackParamList = {
  Login: undefined;
  ChallengeList: undefined;
  Game: {
    tablenum: number;
    listName: string;
    lexicon: string;
  };
  Results: {
    tablenum: number;
    solved: number;
    total: number;
  };
};
