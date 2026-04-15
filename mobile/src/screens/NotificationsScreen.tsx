import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useNotifications } from '@/src/context/NotificationContext';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';
import { AppNotification } from '@/src/types/notification';

const TYPE_ICON: Record<string, { name: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  inquiry: { name: 'chatbox-ellipses', bg: '#E3F2FD', color: '#1565C0' },
  appointment: { name: 'calendar', bg: '#E8F5E9', color: theme.colors.primary },
  system: { name: 'information-circle', bg: '#FFF8E1', color: theme.colors.warning },
};

const getTypeStyle = (type?: string) =>
  TYPE_ICON[type ?? ''] ?? { name: 'notifications' as const, bg: theme.colors.chipBg, color: theme.colors.primary };

export const NotificationsScreen = () => {
  const { notifications, refresh, markAsRead, unreadCount, clearAll } = useNotifications();
  const [isClearing, setIsClearing] = useState(false);

  const runClearAll = useCallback(async () => {
    setIsClearing(true);
    try {
      const deletedCount = await clearAll();
      const noun = deletedCount === 1 ? 'notification' : 'notifications';
      Alert.alert('Cleared', deletedCount > 0 ? `Deleted ${deletedCount} ${noun}.` : 'No notifications to clear.');
    } catch (error) {
      Alert.alert('Clear failed', error instanceof Error ? error.message : 'Unable to clear notifications');
    } finally {
      setIsClearing(false);
    }
  }, [clearAll]);

  const confirmClearAll = useCallback(() => {
    if (!notifications.length || isClearing) return;

    Alert.alert(
      'Clear all notifications',
      'This will permanently delete all notifications from your inbox.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: () => void runClearAll() },
      ]
    );
  }, [notifications.length, isClearing, runClearAll]);

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const typeStyle = getTypeStyle((item as any).type);
      const isUnread = item.status === 'unread';

      return (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            isUnread && styles.cardUnread,
            pressed && styles.cardPressed,
          ]}
          onPress={() => {
            if (isUnread) markAsRead(item._id).catch(() => null);
          }}
        >
          {/* Left icon */}
          <View style={[styles.iconWrap, { backgroundColor: typeStyle.bg }]}>
            <Ionicons name={typeStyle.name} size={20} color={typeStyle.color} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>

          <Ionicons name='chevron-forward' size={16} color={theme.colors.textMuted} />
        </Pressable>
      );
    },
    [markAsRead]
  );

  return (
    <ScreenWrapper scroll={false}>
      {/* Page header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up 🎉'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          {notifications.length > 0 && (
            <Pressable
              onPress={confirmClearAll}
              disabled={isClearing}
              style={({ pressed }) => [
                styles.clearBtn,
                isClearing && styles.clearBtnDisabled,
                pressed && !isClearing && styles.clearBtnPressed,
              ]}
            >
              {isClearing ? (
                <ActivityIndicator size='small' color={theme.colors.danger} />
              ) : (
                <>
                  <Ionicons name='trash-outline' size={14} color={theme.colors.danger} />
                  <Text style={styles.clearBtnText}>Clear all</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* Summary strip when there are unread */}
      {unreadCount > 0 && (
        <View style={styles.summaryStrip}>
          <Ionicons name='radio-button-on' size={14} color={theme.colors.primary} />
          <Text style={styles.summaryText}>
            You have <Text style={styles.summaryBold}>{unreadCount} unread</Text> notification{unreadCount > 1 ? 's' : ''}. Tap to mark as read.
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        onRefresh={refresh}
        refreshing={false}
        ListEmptyComponent={
          <EmptyState
            title='No notifications'
            message='Live updates will appear here in real time.'
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingTop: 4,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
  },
  headerSub: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    ...theme.typography.bodyStrong,
    color: '#fff',
    fontSize: 14,
  },
  clearBtn: {
    height: 34,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F5',
  },
  clearBtnText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
  clearBtnPressed: {
    opacity: 0.82,
  },
  clearBtnDisabled: {
    opacity: 0.6,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  summaryText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  summaryBold: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  cardUnread: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F1FFF4',
  },
  cardPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
