import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createTheme, rem } from "@mantine/core";
import App from "./App.tsx";
import { MantineProvider } from "@mantine/core";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from "./error_page.tsx";
import LoadScheduledQuestions from "./load_scheduled_questions.tsx";
import { AppContextProvider } from "./app_context.tsx";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";

import { Notifications } from "@mantine/notifications";
import WordSearch from "./search/word_search.tsx";
import CardSchedule from "./schedule.tsx";
import Help from "./help.tsx";
import CardStats from "./card_stats.tsx";
import Settings from "./settings.tsx";
import Leaderboard from "./leaderboard.tsx";
import Decks from "./decks.tsx";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <AppContextProvider>
          <App />
        </AppContextProvider>
      ),
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Navigate to="/load-scheduled-questions" replace />,
        },
        {
          path: "/load-scheduled-questions",
          element: <LoadScheduledQuestions />,
        },
        {
          path: "/card-schedules",
          element: <CardSchedule />,
        },
        {
          path: "/word-search",
          element: <WordSearch />,
        },
        {
          path: "/decks",
          element: <Decks />,
        },
        {
          path: "/stats",
          element: <CardStats />,
        },
        {
          path: "/leaderboard",
          element: <Leaderboard />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/help",
          element: <Help />,
        },
      ],
    },
  ],
  {
    basename: "/wordvault",
  },
);

const theme = createTheme({
  // Default font sizes with an additional XXL option
  // https://mantine.dev/theming/typography/
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(16),
    lg: rem(18),
    xl: rem(20),
    xxl: rem(26),
    xxxl: rem(32),
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-center" />
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
