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
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Card as WordVaultCard, Score } from "./gen/rpc/wordvault/api_pb";
import React, { useContext, useMemo } from "react";
import { IconArrowsShuffle, IconArrowUp, IconSpace } from "@tabler/icons-react";
import { AppContext, FontStyle, TileStyle } from "./app_context";
import { useIsSmallScreen } from "./use_is_small_screen";
import classes from "./flashcard.module.css";

interface FlashcardProps {
  flipped: boolean;
  currentCard: WordVaultCard;
  handleFlip: () => void;
  handleScore: (score: Score) => Promise<void>;
  showLoader: boolean;
  onShuffle: () => void;
  onResetOrder: () => void;
  onMoveLetter: (from: number, to: number) => void;
  displayQuestion: string;
  origDisplayQuestion: string;
  isPaywalled: boolean;
  typingMode: boolean;
  missedWords?: Set<string>;
}

type TiledTextProps = {
  classNames: {
    text: string;
    tile: string;
  };
  text: string;
  reorderable: boolean;
  onMoveLetter: (from: number, to: number) => void;
} & Pick<PaperProps, "bg" | "c" | "h" | "w" | "withBorder" | "shadow"> &
  Pick<TextProps, "fw" | "ff">;

const TiledText: React.FC<TiledTextProps> = ({
  text,
  classNames,
  bg,
  h,
  w,
  fw,
  ff,
  c,
  withBorder,
  shadow,
  reorderable,
  onMoveLetter,
}) => {
  const letters = useMemo(() => {
    return text.split("").map((letter, index) => ({
      letter,
      originalIndex: index,
    }));
  }, [text]);

  const items = useMemo(() => {
    return letters.map(({ letter, originalIndex }, index) => (
      <Draggable
        key={originalIndex}
        index={index}
        draggableId={originalIndex.toString()}
        isDragDisabled={!reorderable}
      >
        {(provided) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            style={{
              ...provided.draggableProps.style,
              cursor: reorderable ? "grab" : "default",
            }}
          >
            <Paper
              h={h}
              w={w}
              key={index}
              shadow={shadow}
              bg={bg}
              withBorder={withBorder}
              className={classNames.tile}
            >
              <Center w="100%" h="100%">
                <Text
                  className={classNames.text}
                  c={c}
                  fw={fw}
                  ff={ff}
                  ta="center"
                >
                  {letter}
                </Text>
              </Center>
            </Paper>
          </div>
        )}
      </Draggable>
    ));
  }, [
    letters,
    reorderable,
    fw,
    ff,
    c,
    bg,
    h,
    w,
    withBorder,
    shadow,
    classNames.tile,
    classNames.text,
  ]);

  return (
    <DragDropContext
      onDragEnd={({ destination, source }) => {
        if (!destination) {
          return;
        }

        onMoveLetter(source.index, destination.index);
      }}
    >
      <Droppable droppableId="dnd-list" direction="horizontal">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            <Group gap={rem(2)} wrap="wrap">
              {items}
              {provided.placeholder}
            </Group>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

type QuestionDisplayProps = {
  displayQuestion: string;
  isDark: boolean;
  fontStyle: FontStyle;
  tileStyle: TileStyle;
  theme: MantineTheme;
  side: "front" | "back";
  onMoveLetter: (from: number, to: number) => void;
};

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  displayQuestion,
  isDark,
  fontStyle,
  tileStyle,
  theme,
  side,
  onMoveLetter,
}) => {
  switch (tileStyle) {
    case TileStyle.MatchDisplay: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.gray[8] : theme.colors.gray[4]}
          c={isDark ? theme.colors.gray[0] : undefined}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Yellow: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.yellow[4] : theme.colors.yellow[2]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Orange: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.orange[4] : theme.colors.orange[2]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Blue: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.blue[8] : theme.colors.blue[3]}
          c={isDark ? theme.colors.gray[0] : theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          reorderable={side === "front"}
          text={displayQuestion}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Green: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.green[4] : theme.colors.green[2]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Pink: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.pink[4] : theme.colors.pink[2]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Violet: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.violet[4] : theme.colors.violet[2]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.Red: {
      return (
        <TiledText
          fw={700}
          ff={fontStyle}
          bg={isDark ? theme.colors.red[6] : theme.colors.red[3]}
          c={theme.colors.gray[9]}
          classNames={{
            text: classes.responsiveTileText,
            tile: classes.responsiveTilePaper,
          }}
          text={displayQuestion}
          reorderable={side === "front"}
          onMoveLetter={onMoveLetter}
        />
      );
    }
    case TileStyle.None:
    default: {
      return (
        <Text size="xxxl" fw={700} ta="center" ff={fontStyle}>
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
  onResetOrder,
  onMoveLetter,
  displayQuestion,
  origDisplayQuestion,
  missedWords,
  typingMode,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const smallScreen = useIsSmallScreen();
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
      onClick={onResetOrder}
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
          <Group gap="xs">
            {!smallScreen && shuffleButton}
            <QuestionDisplay
              displayQuestion={displayQuestion}
              isDark={isDark}
              tileStyle={displaySettings.tileStyle}
              fontStyle={displaySettings.fontStyle}
              theme={theme}
              onMoveLetter={onMoveLetter}
              side="front"
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
              {!smallScreen &&
                (typingMode ? (
                  <Text c="dimmed">&nbsp;(0)</Text>
                ) : (
                  <Text c="dimmed" mt="md">
                    &nbsp;
                    <IconSpace />
                  </Text>
                ))}
            </Button>
          </Group>
        </Stack>
      ) : (
        // Back side
        <Stack align="center" gap="sm">
          <Flex mb="md">
            <QuestionDisplay
              onMoveLetter={onMoveLetter}
              displayQuestion={origDisplayQuestion}
              isDark={isDark}
              tileStyle={displaySettings.tileStyle}
              fontStyle={displaySettings.fontStyle}
              theme={theme}
              side="back"
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
