import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '@/src/theme';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const AppInput = ({ label, error, style, ...props }: AppInputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      style={[styles.input, props.multiline && styles.multilineInput, style, error && styles.errorInput]}
      placeholderTextColor={theme.colors.textMuted}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 48,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  errorInput: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
});
