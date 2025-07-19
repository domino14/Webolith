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
  IconFolders,
  IconGraph,
  IconHeartDollar,
  IconMedal2,
  IconMoon,
  IconSettings,
  IconSun,
  IconUserQuestion,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import Cookies from "js-cookie";
import { useIsDecksEnabled } from "./use_is_decks_enabled";

// this can come from the backend later in some other way.
const lexMap = {
  NWL23: 24,
  CSW24: 25,
  FRA24: 23,
  Deutsch: 17,
  OSPS50: 26,
};

function App() {
  const [openedBurger, { toggle: toggleBurger, close: closeBurger }] =
    useDisclosure();
  const {
    lexicon,
    defaultLexicon,
    setLexicon,
    loggedIn,
    isMember,
    setDefaultLexicon,
  } = useContext(AppContext);
  const isDecksEnabled = useIsDecksEnabled();

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
            data={["NWL23", "CSW24", "FRA24", "Deutsch", "OSPS50"]}
            value={lexicon}
            onChange={(val) => setLexicon(val ?? "")}
            mb="md"
          />
          {showChangeLexLink && lexicon && (
            <Button
              variant="transparent"
              onClick={() => changeDefaultLexicon(lexicon)}
            >
              Make default
            </Button>
          )}
          <>
            {[
              [
                "load-scheduled-questions",
                <IconBook color="green" />,
                "Study scheduled questions",
              ],
              [
                "word-search",
                <IconCubePlus color="green" />,
                "Manage WordVault cards",
              ],
              isDecksEnabled
                ? ["decks", <IconFolders color="green" />, "Decks (BETA)"]
                : null,
              ["card-schedules", <IconCalendar color="green" />, "Scheduling"],
              ["stats", <IconGraph color="green" />, "Statistics"],
              ["leaderboard", <IconMedal2 color="green" />, "Leaderboard"],
              ["settings", <IconSettings color="green" />, "Settings"],
              [
                "supporter",
                <IconHeartDollar color="green" />,
                isMember ? "Thank you for your support!" : "Become a supporter",
                true,
              ],
              [
                "help",
                <IconUserQuestion color="green" />,
                "What is WordVault?",
              ],
            ]
              .filter((val) => val !== null)
              .map(([path, icon, label, absolute]) => (
                <NavLink
                  key={path as string}
                  onClick={() => {
                    if (absolute) {
                      window.location.assign("/supporter");
                      return;
                    }
                    if (location.pathname === `/${path}`) {
                      // Force reload the component by resetting the state or triggering a re-render
                      navigate(`/${path}`, { replace: true });
                      window.location.reload(); // This reloads the page completely
                    } else {
                      navigate(`/${path}`);
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
                      {icon}
                      &nbsp; {label}
                    </div>
                  }
                  active={location.pathname === `/${path}`}
                />
              ))}
          </>

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
