import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

type SectionKey = 'received' | 'my';

const getPropertyTitle = (property: Inquiry['propertyId']) =>
  typeof property === 'string' ? 'Property Inquiry' : property?.title || 'Property Inquiry';

export const OwnerInquiriesScreen = () => {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('received');
  const [receivedItems, setReceivedItems] = useState<Inquiry[]>([]);
  const [myItems, setMyItems] = useState<Inquiry[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [replyUpdatingId, setReplyUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = useCallback(async () => {
    if (!userId) {
      setError('Could not identify the current user');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [received, ours] = await Promise.all([
        inquiryApi.getMyReceivedInquiries(userId, getTokenRef.current),
        inquiryApi.getMySentInquiries(userId, getTokenRef.current),
      ]);
      setReceivedItems(received.data || []);
      setMyItems(ours.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReply = async (id: string) => {
    if (!replyMessage.trim()) return;
    try {
      setReplyUpdatingId(id);
      const response = await inquiryApi.replyToInquiry(id, replyMessage.trim(), getTokenRef.current);
      setReceivedItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      setReplyingId(null);
      setReplyMessage('');
    } catch (error) {
      Alert.alert('Reply failed', error instanceof Error ? error.message : 'Try again');
    } finally {
      setReplyUpdatingId(null);
    }
  };

  const updateStatus = async (id: string, nextStatus: Inquiry['inquiryStatus']) => {
    setStatusUpdatingId(id);
    try {
      const response = await inquiryApi.updateInquiryStatus(id, nextStatus, getTokenRef.current);
      setReceivedItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
    } catch (updateError) {
      Alert.alert('Status update failed', updateError instanceof Error ? updateError.message : 'Try again');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const deleteInquiry = async (id: string) => {
    setDeletingId(id);
    try {
      await inquiryApi.deleteInquiry(id, getTokenRef.current);
      setReceivedItems((prev) => prev.filter((item) => item._id !== id));
      setMyItems((prev) => prev.filter((item) => item._id !== id));
      if (replyingId === id) {
        setReplyingId(null);
        setReplyMessage('');
      }
    } catch (deleteError) {
      Alert.alert('Delete failed', deleteError instanceof Error ? deleteError.message : 'Try again');
    } finally {
      setDeletingId(null);
    }
  };

  const onDeletePress = (id: string) => {
    Alert.alert('Delete inquiry', 'Only pending inquiries can be deleted. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteInquiry(id) },
    ]);
  };

  const items = activeSection === 'received' ? receivedItems : myItems;

  const stats = useMemo(
    () => ({
      pending: items.filter((i) => i.inquiryStatus === 'pending').length,
      replied: items.filter((i) => i.inquiryStatus === 'replied').length,
      closed: items.filter((i) => i.inquiryStatus === 'closed').length,
    }),
    [items]
  );

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

      <View style={styles.sectionTabs}>
        <Pressable
          onPress={() => setActiveSection('received')}
          style={[styles.sectionTab, activeSection === 'received' && styles.activeSectionTab]}>
          <Text style={[styles.sectionTabText, activeSection === 'received' && styles.activeSectionTabText]}>
            Received ({receivedItems.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveSection('my')}
          style={[styles.sectionTab, activeSection === 'my' && styles.activeSectionTab]}>
          <Text style={[styles.sectionTabText, activeSection === 'my' && styles.activeSectionTabText]}>
            My ({myItems.length})
          </Text>
        </Pressable>
      </View>

      {!loading && !error && items.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: theme.colors.chipBg }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.replied}</Text>
            <Text style={styles.statLabel}>Replied</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#F5F5F5' }]}>
            <Text style={[styles.statValue, { color: theme.colors.textMuted }]}>{stats.closed}</Text>
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
                      <Text style={styles.subject}>{item.subject || getPropertyTitle(item.propertyId)}</Text>
                      <Text style={styles.propertyTitle}>{getPropertyTitle(item.propertyId)}</Text>
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

              {activeSection === 'my' && !item.replyMessage ? (
                <Text style={styles.sectionHint}>Waiting for the property owner to reply.</Text>
              ) : null}

              {activeSection === 'received' && replyingId === item._id ? (
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
                      loading={replyUpdatingId === item._id}
                      disabled={replyUpdatingId === item._id}
                      style={styles.replyBtn}
                    />
                    <AppButton
                      label='Cancel'
                      variant='secondary'
                      onPress={() => {
                        setReplyingId(null);
                        setReplyMessage('');
                      }}
                      disabled={replyUpdatingId === item._id}
                      style={styles.replyBtn}
                    />
                  </View>
                </View>
              ) : null}

              {activeSection === 'received' ? (
                <View style={styles.inlineActions}>
                  {replyingId !== item._id && !item.replyMessage ? (
                    <AppButton
                      label='Reply'
                      variant='secondary'
                      icon='return-down-forward-outline'
                      onPress={() => setReplyingId(item._id)}
                      style={styles.inlineActionBtn}
                    />
                  ) : null}

                  <AppButton
                    label={item.inquiryStatus === 'closed' ? 'Reopen' : 'Close'}
                    variant='secondary'
                    icon={item.inquiryStatus === 'closed' ? 'refresh-outline' : 'close-outline'}
                    onPress={() =>
                      updateStatus(item._id, item.inquiryStatus === 'closed' ? 'pending' : 'closed')
                    }
                    loading={statusUpdatingId === item._id}
                    disabled={statusUpdatingId === item._id || replyUpdatingId === item._id}
                    style={styles.inlineActionBtn}
                  />
                  {item.inquiryStatus === 'pending' ? (
                    <AppButton
                      label='Delete'
                      variant='danger'
                      icon='trash-outline'
                      onPress={() => onDeletePress(item._id)}
                      loading={deletingId === item._id}
                      disabled={
                        deletingId === item._id ||
                        statusUpdatingId === item._id ||
                        replyUpdatingId === item._id
                      }
                      style={styles.inlineActionBtn}
                    />
                  ) : null}
                </View>
              ) : null}
              {activeSection === 'my' && item.inquiryStatus === 'pending' ? (
                <AppButton
                  label='Delete'
                  variant='danger'
                  icon='trash-outline'
                  onPress={() => onDeletePress(item._id)}
                  loading={deletingId === item._id}
                  disabled={deletingId === item._id}
                  style={styles.deleteBtn}
                />
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={activeSection === 'received' ? 'No received inquiries' : 'No inquiries from you yet'}
              message={
                activeSection === 'received'
                  ? 'Inquiries for your listings will appear here.'
                  : 'Inquiries you send as a buyer will appear here with owner replies.'
              }
            />
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
  sectionTabs: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  sectionTab: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  activeSectionTab: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.chipBg,
  },
  sectionTabText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  activeSectionTabText: {
    color: theme.colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  statChip: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
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
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subject: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  propertyTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
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
  sectionHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
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
  inlineActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: 2,
  },
  inlineActionBtn: {
    flex: 1,
    height: 42,
  },
  deleteBtn: {
    marginTop: 2,
    height: 42,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
