import { NumberInput, Stack, Switch } from "@mantine/core";

export interface FsrsFormValues {
  retentionPercent: number;
  enableShortTerm: boolean;
}

export const validateRetentionPercent = (value: number): string | null => {
  if (value < 70 || value > 97) {
    return "Retention rate must be between 70% and 97%";
  }
  return null;
};

interface FsrsSettingsFieldsProps {
  values: FsrsFormValues;
  getInputProps: (path: keyof FsrsFormValues) => Record<string, unknown>;
  mt?: string;
}

export function FsrsSettingsFields({
  values,
  getInputProps,
  mt,
}: FsrsSettingsFieldsProps) {
  return (
    <Stack gap="md" mt={mt}>
      <NumberInput
        label="Desired retention rate"
        description="Target probability of recalling a word during review (70%–97%)"
        suffix="%"
        min={70}
        max={97}
        decimalScale={2}
        {...getInputProps("retentionPercent")}
      />
      <Switch
        label="Use short-term scheduler"
        description="Prioritize rapid study of recently-missed words"
        checked={values.enableShortTerm}
        {...getInputProps("enableShortTerm")}
      />
    </Stack>
  );
}
