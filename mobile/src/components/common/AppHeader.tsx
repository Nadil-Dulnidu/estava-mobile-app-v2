import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/src/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export const AppHeader = ({ title, subtitle, right }: AppHeaderProps) => (
  <View style={styles.row}>
    <View style={styles.left}>
      <View style={styles.titleRow}>
        <View style={styles.accentDot} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {right ? <View>{right}</View> : null}
  </View>
);

export const SectionTitle = ({ title, action }: { title: string; action?: ReactNode }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
  },
  subtitle: {
    marginTop: 4,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  sectionRow: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
});
