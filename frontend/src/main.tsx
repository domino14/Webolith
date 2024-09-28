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
          path: "/schedules",
        },
        {
          path: "/word-search",
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
    <MantineProvider defaultColorScheme="auto">
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>
);
