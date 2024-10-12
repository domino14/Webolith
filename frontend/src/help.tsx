import { List, Text } from "@mantine/core";

const Help = () => {
  return (
    <>
      <Text mb="sm">
        WordVault is a spaced repetition card app. It uses an open-source
        algorithm called FSRS, created by a very smart dude. There have been
        studies done on this algorithm that suggest that it is significantly
        better than previous algorithms such as the Anki / SuperMemo / Leitner
        cardbox system, in terms of retention. Additionally, it typically
        requires fewer repetitions to achieve a good level of recall.
      </Text>
      <Text mb="sm">
        You can read more about FSRS here:{" "}
        <a
          href="https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs"
          target="_blank"
        >
          ABCs of FSRS
        </a>
      </Text>
      <Text size="xl" fw={700} mt="sm">
        How to use:
      </Text>
      <Text mb="sm">
        When you have no cards in your WordVault, you can add some via the Word
        Search tab on the left. We recommend you only add as many cards as you
        want to do in one day. For some this could be a few dozen, for some a
        few hundred. Start small if you haven't done this before.
      </Text>
      <Text mb="sm">Some good beginning cards:</Text>
      <List>
        <List.Item>The three-letter words</List.Item>
        <List.Item>The four-letter JQXZ words</List.Item>
        <List.Item>The five-letter JQXZ words</List.Item>
        <List.Item>The top 100 7-letter bingos by probability</List.Item>
        <List.Item>The top 100 8-letter bingos by probability</List.Item>
      </List>
      <Text mb="sm">
        For some people it might be faster to learn shorter words with just
        Wordwalls. See what works for you.
      </Text>
      <Text size="xl" mt="sm" fw={700}>
        Quizzing
      </Text>
      <Text mb="sm">
        After adding some cards, you can then click on "Load scheduled
        questions" on the left. Every time you come back to the WordVault app,
        you'll have the option to solve some questions until you run out of
        questions for that day. At this point you can either add some more or
        take a break until tomorrow.
      </Text>
      <Text>
        When given a card, solve it in your head. Click or type "F" to flip the
        card and see the answers.
      </Text>
      <Text size="xl" mt="sm" fw={700}>
        Grading
      </Text>
      <Text mb="sm">
        Grading cards in FSRS is very important. It is what makes the algorithm
        work.
      </Text>
      <List>
        <List.Item>
          Missed - Only click this (or type in "1") if you missed the question.
        </List.Item>
        <List.Item>
          Hard - The question was hard, but you solved it after considerable
          effort. (Type in "2")
        </List.Item>
        <List.Item>
          Good - The question was at a good difficulty level. It took a little
          effort to solve it. (Type in "3")
        </List.Item>
        <List.Item>
          Easy - The question was easy! You solved it immediately. You might
          think you'd never miss it. (Type in "4")
        </List.Item>
        <Text fw={700}>
          Important note: Hard, Good, and Easy all mean you solved the question.
          Don't click Hard if you missed it!
        </Text>
      </List>
      <Text size="xl" mt="sm" fw={700}>
        Scheduling
      </Text>
      <Text mb="sm">
        At any time you can see your card schedule on the left by clicking the
        scheduling button. This will tell you how many cards you have overdue,
        and how many cards you have due every day/week in the future.
      </Text>
      <Text mb="sm">
        Try to be consistent and solve all your cards every day. If you miss a
        few days and you have a large build-up of cards, you can choose to
        postpone some by clicking the Postpone button.
      </Text>
      <Text mb="sm">
        The postponement algorithm is intelligent and it will first postpone
        those cards that you know best. Still, it's not perfect. If you postpone
        too many times, you will forget your words!
      </Text>
      <Text size="xl" mt="sm" fw={700}>
        Card statistics
      </Text>
      <Text mb="sm">
        You can type in an alphagram in here to see statistics about this card
        and your solving history for it.
      </Text>
    </>
  );
};

export default Help;
