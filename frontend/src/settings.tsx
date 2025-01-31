import { useForm } from "@mantine/form";
import React, { useContext, useEffect } from "react";
import {
  AppContext,
  FontStyle,
  DisplaySettings,
  TileStyle,
  SchedulerSettings,
} from "./app_context";
import {
  Button,
  Divider,
  NumberInput,
  Select,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { FsrsScheduler } from "./gen/rpc/wordvault/api_pb";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { PromiseClient } from "@connectrpc/connect";

const _submitFsrsSettingsAsync = async (
  wordVaultClient: PromiseClient<typeof WordVaultService>,
  values: SchedulerSettings,
): Promise<boolean> => {
  try {
    await wordVaultClient.editFsrsParameters({
      parameters: {
        requestRetention: values.retentionPercent / 100,
        scheduler: values.enableShortTerm
          ? FsrsScheduler.SHORT_TERM
          : FsrsScheduler.LONG_TERM,
      },
    });
    return true;
  } catch {
    return false;
  }
};

const Settings: React.FC = () => {
  const settingsForm = useForm<DisplaySettings & SchedulerSettings>({
    initialValues: {
      fontStyle: FontStyle.Monospace,
      tileStyle: TileStyle.None,
      showNumAnagrams: true,
      customOrder: "",
      enableShortTerm: false,
      retentionPercent: 90,
    },
    validate: {
      retentionPercent: (value) => {
        if (value < 70 || value > 97) {
          return "Retention rate must be between 70% and 97%";
        }
      },
    },
  });

  const {
    displaySettings,
    setDisplaySettings,
    schedulerSettings,
    setSchedulerSettings,
    wordVaultClient,
  } = useContext(AppContext);
  const { setValues } = settingsForm;

  // When displaySettings change, update the form with the new values
  useEffect(() => {
    if (displaySettings || schedulerSettings) {
      setValues((values) => {
        return { ...values, ...displaySettings, ...schedulerSettings };
      });
    }
  }, [displaySettings, schedulerSettings, setValues]);

  return (
    <div style={{ maxWidth: 400 }}>
      <form
        onSubmit={settingsForm.onSubmit(async (values) => {
          if (!wordVaultClient) {
            return;
          }

          const [displaySettingsResponse, schedulerSettingsResponseOk] =
            await Promise.all([
              fetch("/accounts/profile/wordvault_settings", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fontStyle: values.fontStyle,
                  tileStyle: values.tileStyle,
                  showNumAnagrams: values.showNumAnagrams,
                  customOrder: values.customOrder,
                }),
              }),
              _submitFsrsSettingsAsync(wordVaultClient, values),
            ]);

          if (!displaySettingsResponse.ok || !schedulerSettingsResponseOk) {
            throw new Error("Failed to save settings.");
          }

          notifications.show({
            message: "Settings saved successfully!",
            color: "green",
            title: "Success",
          });
          setDisplaySettings({
            fontStyle: values.fontStyle,
            tileStyle: values.tileStyle,
            showNumAnagrams: values.showNumAnagrams,
            customOrder: values.customOrder,
          });
          setSchedulerSettings({
            enableShortTerm: values.enableShortTerm,
            retentionPercent: values.retentionPercent,
          });
        })}
      >
        {/* Add form fields here, for example: */}
        <Text size="xl">Display Settings</Text>

        <Select
          data={[
            {
              value: FontStyle.Monospace,
              label: "Monospace",
            },
            {
              value: FontStyle.SansSerif,
              label: "Sans-serif",
            },
          ]}
          label="Question font style"
          {...settingsForm.getInputProps("fontStyle")}
          mt="lg"
        />
        <Select
          data={[
            {
              value: TileStyle.None,
              label: "None",
            },
            {
              value: TileStyle.MatchDisplay,
              label: "Match dark/light mode",
            },
            {
              value: TileStyle.Blue,
              label: "Blue",
            },
            {
              value: TileStyle.Orange,
              label: "Orange",
            },
            {
              value: TileStyle.Yellow,
              label: "Yellow",
            },
            {
              value: TileStyle.Green,
              label: "Green",
            },
            {
              value: TileStyle.Pink,
              label: "Pink",
            },
            {
              value: TileStyle.Violet,
              label: "Violet",
            },
            {
              value: TileStyle.Red,
              label: "Red",
            },
          ]}
          label="Question tile style"
          {...settingsForm.getInputProps("tileStyle")}
          mt="lg"
        />
        <Switch
          checked={settingsForm.values.showNumAnagrams} // Bind to checked
          {...settingsForm.getInputProps("showNumAnagrams")}
          mt="lg"
          label="Show number of words in cards"
        />
        <TextInput
          type="text"
          {...settingsForm.getInputProps("customOrder")}
          label="Custom letter order"
          description="Leave blank to use alphabetical. All letters not specified will be in alphabetical order."
          placeholder="AEIOU..."
          mt="lg"
        />

        <Divider mt="lg" />

        <Text size="xl" mt="lg">
          Scheduling Settings
        </Text>

        <NumberInput
          label="Desired retention rate"
          description="Target probability of recalling a word during review. The scheduling adjusts to maintain this rate. Choose 70%–97% (default: 90%)"
          placeholder="95%"
          suffix="%"
          min={70}
          max={97}
          decimalScale={2}
          {...settingsForm.getInputProps("retentionPercent")}
          mt="lg"
        />
        <Switch
          label="Use short-term scheduler"
          description="Prioritize rapid study of recently-missed words"
          checked={settingsForm.values.enableShortTerm}
          {...settingsForm.getInputProps("enableShortTerm")}
          mt="lg"
        />

        <Button type="submit" mt="lg">
          Save
        </Button>
      </form>
    </div>
  );
};

export default Settings;
