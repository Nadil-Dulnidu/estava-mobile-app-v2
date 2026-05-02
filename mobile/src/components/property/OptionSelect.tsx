import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/src/theme';

interface Option {
  label: string;
  value: string;
}

interface OptionSelectProps {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
  error?: string;
}

export const OptionSelect = ({ label, value, options, onChange, error }: OptionSelectProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.options}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  chipLabelSelected: {
    color: '#fff',
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
});
