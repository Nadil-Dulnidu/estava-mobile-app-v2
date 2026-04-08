import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { theme } from '@/src/theme';

interface StateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const LoadingState = ({ message = 'Loading...' }: StateProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>{message}</Text>
  </View>
);

export const EmptyState = ({
  title = 'Nothing here yet',
  message = 'Try creating one or adjusting your filters.',
}: StateProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Please try again.',
  onRetry,
}: StateProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry ? <AppButton label='Retry' onPress={onRetry} /> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  message: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
});
