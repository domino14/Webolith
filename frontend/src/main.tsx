import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
      ],
    },
  ],
  {
    basename: "/wordvault",
  }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <Notifications position="top-center" />
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
);
