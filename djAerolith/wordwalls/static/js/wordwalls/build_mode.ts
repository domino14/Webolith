/**
 * @fileOverview Utils for build mode.
 */
function pointsForWord(word: string): number {
  switch (word.length) {
    case 2:
      return 0;
    case 3:
    case 4:
      return 1;
    case 5:
      return 2;
    case 6:
      return 3;
    case 7:
      return 5;
    case 8:
      return 11;
    default:
      return 15;
  }
}

export default pointsForWord;
