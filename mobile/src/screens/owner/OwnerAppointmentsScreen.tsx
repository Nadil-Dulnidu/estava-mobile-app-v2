import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { appointmentApi } from '@/src/services/api/appointment.api';
import { Appointment } from '@/src/types/appointment';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';

const STATUS_COLORS: Record<string, string> = {
  pending: theme.colors.warning,
  confirmed: theme.colors.primary,
  completed: theme.colors.success,
  cancelled: theme.colors.danger,
};

type SectionKey = 'received' | 'my';

const getPropertyTitle = (property: Appointment['propertyId']) =>
  typeof property === 'string' ? 'Property Visit' : property?.title || 'Property Visit';

export const OwnerAppointmentsScreen = () => {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>('received');
  const [receivedItems, setReceivedItems] = useState<Appointment[]>([]);
  const [myItems, setMyItems] = useState<Appointment[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
        appointmentApi.getMyReceivedAppointments(userId, { page: 1, limit: 30 }, getTokenRef.current),
        appointmentApi.getMyAppointments(userId, { page: 1, limit: 30 }, getTokenRef.current),
      ]);
      setReceivedItems(received.data || []);
      setMyItems(ours.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, appointmentStatus: Appointment['appointmentStatus']) => {
    setUpdatingId(id);
    try {
      const response = await appointmentApi.updateAppointmentStatus(id, appointmentStatus, getTokenRef.current);
      setReceivedItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
    } catch (updateError) {
      Alert.alert('Status update failed', updateError instanceof Error ? updateError.message : 'Try again');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAppointment = async (id: string) => {
    setDeletingId(id);
    try {
      await appointmentApi.deleteAppointment(id, getTokenRef.current);
      setReceivedItems((prev) => prev.filter((item) => item._id !== id));
      setMyItems((prev) => prev.filter((item) => item._id !== id));
    } catch (deleteError) {
      Alert.alert('Delete failed', deleteError instanceof Error ? deleteError.message : 'Try again');
    } finally {
      setDeletingId(null);
    }
  };

  const onDeletePress = (id: string) => {
    Alert.alert('Delete appointment', 'Only pending appointments can be deleted. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteAppointment(id) },
    ]);
  };

  const items = activeSection === 'received' ? receivedItems : myItems;

  const stats = useMemo(
    () => ({
      pending: items.filter((i) => i.appointmentStatus === 'pending').length,
      confirmed: items.filter((i) => i.appointmentStatus === 'confirmed').length,
      completed: items.filter((i) => i.appointmentStatus === 'completed').length,
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
          <Text style={styles.headerTitle}>Appointments</Text>
          <Text style={styles.headerSubtitle}>Manage visit schedules</Text>
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
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>
      )}

      {loading ? <LoadingState message='Loading appointments...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.calendarIcon}>
                    <Ionicons name='calendar' size={18} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.title}>{getPropertyTitle(item.propertyId)}</Text>
                    <Text style={styles.dateText}>{formatDate(item.appointmentDateTime)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: (STATUS_COLORS[item.appointmentStatus] || theme.colors.textMuted) + '18' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[item.appointmentStatus] || theme.colors.textMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: STATUS_COLORS[item.appointmentStatus] || theme.colors.textMuted },
                    ]}
                  >
                    {item.appointmentStatus}
                  </Text>
                </View>
              </View>
              {item.visitPurpose ? (
                <Text style={styles.purpose}>{item.visitPurpose}</Text>
              ) : null}
              {activeSection === 'my' ? (
                <Text style={styles.sectionHint}>Track owner updates here. Status changes appear in real time.</Text>
              ) : null}
              {activeSection === 'received' &&
              (item.appointmentStatus === 'pending' || item.appointmentStatus === 'confirmed') ? (
                <View style={styles.actions}>
                  {item.appointmentStatus === 'pending' && (
                    <AppButton
                      label='Confirm'
                      icon='checkmark-outline'
                      onPress={() => updateStatus(item._id, 'confirmed')}
                      loading={updatingId === item._id}
                      disabled={updatingId === item._id}
                      style={styles.actionBtn}
                    />
                  )}
                  <AppButton
                    label='Complete'
                    variant='secondary'
                    icon='checkmark-done-outline'
                    onPress={() => updateStatus(item._id, 'completed')}
                    loading={updatingId === item._id}
                    disabled={updatingId === item._id}
                    style={styles.actionBtn}
                  />
                </View>
              ) : null}
              {item.appointmentStatus === 'pending' ? (
                <AppButton
                  label='Delete'
                  variant='danger'
                  icon='trash-outline'
                  onPress={() => onDeletePress(item._id)}
                  loading={deletingId === item._id}
                  disabled={deletingId === item._id || updatingId === item._id}
                  style={styles.deleteBtn}
                />
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title={activeSection === 'received' ? 'No received appointments' : 'No appointments from you yet'}
              message={
                activeSection === 'received'
                  ? 'Appointment requests for your listings will appear here.'
                  : 'Appointments you made as a buyer will appear here.'
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
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
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
  purpose: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actionBtn: {
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
