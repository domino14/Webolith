import "@mantine/core/styles.css";

import {
  ActionIcon,
  Alert,
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  ScrollArea,
  Select,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import wordvault from "./assets/wordvault-sm.png";
import { Text } from "@mantine/core";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "./app_context";
import { useContext, useEffect, useState } from "react";
import { LoginState } from "./constants";
import {
  IconBook,
  IconCalendar,
  IconCubePlus,
  IconMoon,
  IconSearch,
  IconSun,
  IconUserQuestion,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Cookies from "js-cookie";

// this can come from the backend later in some other way.
const lexMap = {
  NWL23: 24,
  CSW21: 18,
  FRA24: 23,
  Deutsch: 17,
};

function App() {
  const [openedBurger, { toggle: toggleBurger, close: closeBurger }] =
    useDisclosure();
  const { lexicon, defaultLexicon, setLexicon, loggedIn, setDefaultLexicon } =
    useContext(AppContext);
  const [showChangeLexLink, setShowChangeLexLink] = useState(false);
  const loginURL = `${window.location.protocol}//${window.location.host}/accounts/login?next=/wordvault`;
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (lexicon === "" || defaultLexicon === "") {
      return;
    }
    setShowChangeLexLink(lexicon !== defaultLexicon);
  }, [lexicon, defaultLexicon]);

  const changeDefaultLexicon = async (lexicon: string) => {
    const lexID = lexMap[lexicon as keyof typeof lexMap];
    try {
      const response = await fetch("/accounts/profile/set_default_lexicon/", {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken") ?? "",
        }),
        body: JSON.stringify({ defaultLexicon: lexID }),
      });
      if (response?.status !== 200) {
        throw new Error("Got status " + response?.status);
      }
      setDefaultLexicon(lexicon);
    } catch (e) {
      notifications.show({
        color: "red",
        title: "Error",
        message: String(e),
      });
    }
  };

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !openedBurger },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={openedBurger}
              onClick={toggleBurger}
              hiddenFrom="sm"
              size="sm"
            />
            <img src={wordvault} width={48} />
            <Text size="xl">Aerolith WordVault</Text>
          </Group>

          {/* Dark/Light mode toggle icon */}
          <ActionIcon
            variant="outline"
            color={isDark ? "yellow" : "blue"}
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Select
            label="Lexicon"
            data={["NWL23", "CSW21", "FRA24", "Deutsch"]}
            value={lexicon}
            onChange={(val) => setLexicon(val ?? "")}
          />
          {showChangeLexLink && lexicon && (
            <Button
              variant="transparent"
              onClick={() => changeDefaultLexicon(lexicon)}
            >
              Make default
            </Button>
          )}

          <NavLink
            mt="md"
            onClick={() => {
              if (location.pathname === "/load-scheduled-questions") {
                // Force reload the component by resetting the state or triggering a re-render
                navigate("/load-scheduled-questions", { replace: true });
                window.location.reload(); // This reloads the page completely
              } else {
                navigate("/load-scheduled-questions");
              }
              closeBurger();
            }}
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
              >
                <IconBook color="green" />
                &nbsp; Load scheduled questions
              </div>
            }
            active={location.pathname === "/load-scheduled-questions"}
          />
          <NavLink
            onClick={() => {
              navigate("word-search");
              closeBurger();
            }}
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
              >
                <IconCubePlus color="green" />
                &nbsp; Add to WordVault
              </div>
            }
            active={location.pathname === "/word-search"}
          />
          <NavLink
            onClick={() => {
              navigate("card-schedules");
              closeBurger();
            }}
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
              >
                <IconCalendar color="green" />
                &nbsp; Scheduling
              </div>
            }
            active={location.pathname === "/card-schedules"}
          />
          <NavLink
            onClick={() => {
              navigate("card-stats");
              closeBurger();
            }}
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
              >
                <IconSearch color="green" />
                &nbsp;Card statistics
              </div>
            }
            active={location.pathname === "/card-stats"}
          />
          <NavLink
            onClick={() => {
              navigate("help");
              closeBurger();
            }}
            label={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "5px 0",
                }}
              >
                <IconUserQuestion color="green" />
                &nbsp; What is WordVault?
              </div>
            }
            active={location.pathname === "/help"}
          />
          <br />
          <NavLink href="/wordwalls" label={<>Aerolith WordWalls</>} />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {loggedIn === LoginState.NotLoggedIn ? (
          <Alert variant="light" color="red" title="Not logged in">
            You don't appear to be logged in to Aerolith. Please log in here:{" "}
            <a href={loginURL}>{loginURL}</a>
          </Alert>
        ) : null}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
