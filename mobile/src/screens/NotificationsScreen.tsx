import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { EmptyState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useNotifications } from '@/src/context/NotificationContext';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';

export const NotificationsScreen = () => {
  const { notifications, refresh, markAsRead, unreadCount } = useNotifications();

  const renderItem = useCallback(
    ({ item }: { item: (typeof notifications)[number] }) => (
      <Pressable
        style={[styles.item, item.status === 'unread' && styles.unread]}
        onPress={() => {
          if (item.status === 'unread') {
            markAsRead(item._id).catch(() => null);
          }
        }}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.message}>{item.message}</Text>
      </Pressable>
    ),
    [markAsRead]
  );

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader
        title='Notifications'
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onRefresh={refresh}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState title='No notifications' message='Live updates will appear here in real time.' />
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  item: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  unread: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.chipBg,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
