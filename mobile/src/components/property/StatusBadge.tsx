import { StyleSheet, Text, View } from 'react-native';
import { PropertyStatus } from '@/src/types/property';
import { theme } from '@/src/theme';

const map: Record<PropertyStatus, { text: string; fg: string; bg: string }> = {
  available: { text: 'Available', fg: theme.colors.success, bg: '#DCFCE7' },
  sold: { text: 'Sold', fg: theme.colors.danger, bg: '#FEE2E2' },
  rented: { text: 'Rented', fg: theme.colors.warning, bg: '#FEF3C7' },
  unavailable: { text: 'Unavailable', fg: theme.colors.textSecondary, bg: '#E2E8F0' },
};

export const StatusBadge = ({ status }: { status: PropertyStatus }) => {
  const cfg = map[status];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.fg }]}>{cfg.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  text: {
    ...theme.typography.caption,
  },
});
