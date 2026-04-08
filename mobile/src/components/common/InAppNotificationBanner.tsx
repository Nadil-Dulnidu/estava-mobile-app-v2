import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNotifications } from '@/src/context/NotificationContext';
import { theme } from '@/src/theme';

export const InAppNotificationBanner = () => {
  const { banner, dismissBanner } = useNotifications();

  if (!banner) return null;

  return (
    <Pressable style={styles.wrapper} onPress={dismissBanner}>
      <View style={styles.content}>
        <Text style={styles.title}>{banner.title}</Text>
        <Text style={styles.message}>{banner.message}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    top: 54,
    zIndex: 1000,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  message: {
    ...theme.typography.body,
    marginTop: 2,
    color: theme.colors.textSecondary,
  },
});
