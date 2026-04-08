import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '@/src/theme';

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export const ChipInput = ({ label, values, onChange }: ChipInputProps) => {
  const [text, setText] = useState('');

  const add = () => {
    const normalized = text.trim().toLowerCase();
    if (!normalized || values.includes(normalized)) {
      setText('');
      return;
    }
    onChange([...values, normalized]);
    setText('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Add ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />
        <Pressable style={styles.add} onPress={add}>
          <Ionicons name='add' size={18} color='#fff' />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {values.map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <Pressable onPress={() => onChange(values.filter((v) => v !== item))}>
              <Ionicons name='close' size={14} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 46,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
  },
  chipText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
});
