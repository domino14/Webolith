import {
  Card,
  Stack,
  Group,
  Button,
  Paper,
  Center,
  Loader,
  Text,
  useMantineTheme,
  useMantineColorScheme,
  TextProps,
  Flex,
  PaperProps,
  rem,
  MantineTheme,
} from "@mantine/core";
import { Card as WordVaultCard, Score } from "./gen/rpc/wordvault/api_pb";
import React, { useContext } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { IconArrowsShuffle, IconArrowUp } from "@tabler/icons-react";
import { AppContext, FontStyle, TileStyle } from "./app_context";

interface FlashcardProps {
  flipped: boolean;
  currentCard: WordVaultCard;
  handleFlip: () => void;
  handleScore: (score: Score) => Promise<void>;
  showLoader: boolean;
  onShuffle: () => void;
  onCustomArrange: () => void;
  displayQuestion: string;
  origDisplayQuestion: string;
  isPaywalled: boolean;
  missedWords?: Set<string>;
}

type TiledTextProps = {
  text: string;
} & Pick<PaperProps, "bg" | "c" | "h" | "w" | "withBorder" | "shadow"> &
  Pick<TextProps, "size" | "fw" | "ff">;

const TiledText: React.FC<TiledTextProps> = ({
  text,
  bg,
  c,
  h,
  w,
  fw,
  ff,
  size,
  withBorder,
  shadow,
}) => {
  return (
    <Group gap="xs" wrap="wrap">
      {text.split("").map((char, index) => (
        <Paper
          h={h}
          w={w}
          key={index}
          shadow={shadow}
          bg={bg}
          withBorder={withBorder}
        >
          <Center w="100%" h="100%">
            <Text c={c} size={size} fw={fw} ff={ff} ta="center">
              {char}
            </Text>
          </Center>
        </Paper>
      ))}
    </Group>
  );
};

type QuestionDisplayProps = {
  displayQuestion: string;
  isDark: boolean;
  fontStyle: FontStyle;
  tileStyle: TileStyle;
  theme: MantineTheme;
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  displayQuestion,
  isDark,
  fontStyle,
  tileStyle,
  theme,
}) => {
  console.log("tileStyle", { tileStyle, fontStyle });
  switch (tileStyle) {
    case TileStyle.MatchDisplay: {
      return (
        <TiledText
          size="xxl"
          h={rem(40)}
          w={rem(40)}
          fw={700}
          ff={fontStyle}
          withBorder={!isDark}
          shadow={isDark ? "xs" : undefined}
          bg={isDark ? theme.colors.gray[8] : theme.colors.gray[4]}
          c={isDark ? theme.colors.gray[0] : undefined}
          text={displayQuestion}
        />
      );
    }
    case TileStyle.None:
    default: {
      return (
        <Text size="xxl" fw={700} ta="center" ff={fontStyle}>
          {displayQuestion}
        </Text>
      );
    }
  }
};

const Flashcard: React.FC<FlashcardProps> = ({
  flipped,
  handleFlip,
  currentCard,
  handleScore,
  showLoader,
  onShuffle,
  onCustomArrange,
  displayQuestion,
  origDisplayQuestion,
  missedWords,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const smallScreen = useMediaQuery("(max-width: 40em)");
  const { displaySettings } = useContext(AppContext);
  const backgroundColor = isDark ? theme.colors.dark[8] : theme.colors.gray[0];

  const shuffleButton = (
    <Button
      variant="transparent"
      size="xs"
      c={isDark ? theme.colors.gray[8] : theme.colors.gray[5]}
      onClick={onShuffle}
    >
      <IconArrowsShuffle />
    </Button>
  );

  const resetArrangementButton = (
    <Button
      variant="transparent"
      size="xs"
      c={isDark ? theme.colors.gray[8] : theme.colors.gray[5]}
      onClick={onCustomArrange}
    >
      <IconArrowUp />
    </Button>
  );

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      m="md"
      withBorder
      style={{
        maxWidth: 600,
        width: "100%",
        backgroundColor: backgroundColor,
      }}
    >
      {!flipped ? (
        // Front side
        <Stack align="center" gap="md">
          <Group>
            {!smallScreen && shuffleButton}
            <QuestionDisplay
              displayQuestion={displayQuestion}
              isDark={isDark}
              tileStyle={displaySettings.tileStyle}
              fontStyle={displaySettings.fontStyle}
              theme={theme}
            />
            {!smallScreen && resetArrangementButton}
          </Group>
          {smallScreen && (
            <Group gap="xs">
              {shuffleButton}
              {resetArrangementButton}
            </Group>
          )}
          {currentCard.alphagram?.words.length &&
            displaySettings.showNumAnagrams && (
              <Text size="xl" c="dimmed" ta="center">
                Words: {currentCard.alphagram?.words.length}
              </Text>
            )}
          <Group mt="md">
            <Button onClick={handleFlip} size="lg">
              Show answer
              {!smallScreen && (
                <Text component="span" size="sm">
                  &nbsp; (0)
                </Text>
              )}
            </Button>
          </Group>
        </Stack>
      ) : (
        // Back side
        <Stack align="center" gap="sm">
          <Flex mb="md">
            <QuestionDisplay
              displayQuestion={origDisplayQuestion}
              isDark={isDark}
              tileStyle={displaySettings.tileStyle}
              fontStyle={displaySettings.fontStyle}
              theme={theme}
            />
          </Flex>
          {currentCard.alphagram?.words.map((word) => {
            const highlightAsMissed =
              missedWords !== undefined &&
              currentCard.alphagram?.words &&
              missedWords.size < currentCard.alphagram.words.length &&
              missedWords.has(word.word);

            return (
              <div key={word.word}>
                <Center>
                  <Text span c="dimmed" size="md" fw={500} mr="xs">
                    {word.frontHooks}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.innerFrontHook ? "·" : ""}
                  </Text>
                  <Text
                    span
                    size="md"
                    c={highlightAsMissed ? "red" : undefined}
                    fw={highlightAsMissed ? 700 : 500}
                    td={highlightAsMissed ? "underline" : undefined}
                  >
                    {word.word}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.innerBackHook ? "·" : ""}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500} ml="xs">
                    {word.lexiconSymbols}
                  </Text>
                  <Text span c="dimmed" size="md" fw={500}>
                    {word.backHooks}
                  </Text>
                </Center>
                <Text size="md" c="dimmed">
                  {word.definition}
                </Text>
              </div>
            );
          })}
          <Group mt="sm" justify="space-evenly">
            <Button
              color="red"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.AGAIN)}
              size={smallScreen ? "xs" : "lg"}
            >
              Missed
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (1)
                </Text>
              )}
            </Button>
            <Button
              color="yellow"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.HARD)}
              size={smallScreen ? "xs" : "lg"}
            >
              Hard
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (2)
                </Text>
              )}
            </Button>
            <Button
              color="green"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.GOOD)}
              size={smallScreen ? "xs" : "lg"}
            >
              Good
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (3)
                </Text>
              )}
            </Button>
            <Button
              color="gray"
              variant={isDark ? "light" : "outline"}
              onClick={() => handleScore(Score.EASY)}
              size={smallScreen ? "xs" : "lg"}
            >
              Easy
              {!smallScreen && (
                <Text component="span" c="dimmed" size="sm">
                  &nbsp; (4)
                </Text>
              )}
            </Button>
          </Group>
          {showLoader ? <Loader color="blue" /> : null}
        </Stack>
      )}
    </Card>
  );
};

export default Flashcard;
