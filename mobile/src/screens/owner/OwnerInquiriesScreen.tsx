import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { inquiryApi } from '@/src/services/api/inquiry.api';
import { Inquiry } from '@/src/types/inquiry';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';

const STATUS_COLORS: Record<string, string> = {
  pending: theme.colors.warning,
  replied: theme.colors.primary,
  closed: theme.colors.textMuted,
};

export const OwnerInquiriesScreen = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inquiryApi.getMyReceivedInquiries(getTokenRef.current);
      setItems(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitReply = async (id: string) => {
    if (!replyMessage.trim()) return;
    try {
      const response = await inquiryApi.replyToInquiry(id, replyMessage.trim(), getTokenRef.current);
      setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      setReplyingId(null);
      setReplyMessage('');
    } catch (error) {
      Alert.alert('Reply failed', error instanceof Error ? error.message : 'Try again');
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Inquiry Requests</Text>
          <Text style={styles.headerSubtitle}>Respond to property inquiries</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats summary */}
      {!loading && !error && items.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              {items.filter((i) => i.inquiryStatus === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: theme.colors.chipBg }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {items.filter((i) => i.inquiryStatus === 'replied').length}
            </Text>
            <Text style={styles.statLabel}>Replied</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#F5F5F5' }]}>
            <Text style={[styles.statValue, { color: theme.colors.textMuted }]}>
              {items.filter((i) => i.inquiryStatus === 'closed').length}
            </Text>
            <Text style={styles.statLabel}>Closed</Text>
          </View>
        </View>
      )}

      {loading ? <LoadingState message='Loading inquiries...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.inquiryIcon}>
                    <Ionicons name='chatbox-ellipses' size={18} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subject}>{item.subject || 'Inquiry'}</Text>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: (STATUS_COLORS[item.inquiryStatus] || theme.colors.textMuted) + '18' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[item.inquiryStatus] || theme.colors.textMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_COLORS[item.inquiryStatus] || theme.colors.textMuted },
                    ]}
                  >
                    {item.inquiryStatus}
                  </Text>
                </View>
              </View>

              <View style={styles.messageBox}>
                <Ionicons name='chatbubble-outline' size={14} color={theme.colors.textMuted} />
                <Text style={styles.message}>{item.message}</Text>
              </View>

              {item.replyMessage ? (
                <View style={styles.replyPreview}>
                  <Ionicons name='return-down-forward-outline' size={14} color={theme.colors.primary} />
                  <Text style={styles.replyText}>{item.replyMessage}</Text>
                </View>
              ) : null}

              {replyingId === item._id ? (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.input}
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    placeholder='Write your reply...'
                    placeholderTextColor={theme.colors.textMuted}
                    multiline
                  />
                  <View style={styles.replyActions}>
                    <AppButton
                      label='Send'
                      icon='send-outline'
                      onPress={() => submitReply(item._id)}
                      style={styles.replyBtn}
                    />
                    <AppButton
                      label='Cancel'
                      variant='secondary'
                      onPress={() => {
                        setReplyingId(null);
                        setReplyMessage('');
                      }}
                      style={styles.replyBtn}
                    />
                  </View>
                </View>
              ) : !item.replyMessage ? (
                <AppButton
                  label='Reply'
                  variant='secondary'
                  icon='return-down-forward-outline'
                  onPress={() => setReplyingId(item._id)}
                />
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title='No inquiries yet' message='New inquiries will appear here.' />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  statChip: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  inquiryIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subject: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  dateText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messageBox: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: theme.colors.chipBg,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  replyText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    flex: 1,
  },
  replyBox: {
    gap: theme.spacing.xs,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minHeight: 80,
    color: theme.colors.textPrimary,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  replyBtn: {
    flex: 1,
    height: 42,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
