import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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

export const OwnerAppointmentsScreen = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Appointment[]>([]);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointmentApi.getAppointments({ page: 1, limit: 30 }, getTokenRef.current);
      setItems(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, appointmentStatus: Appointment['appointmentStatus']) => {
    const response = await appointmentApi.updateAppointmentStatus(id, appointmentStatus, getTokenRef.current);
    setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
  };

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

      {/* Stats summary */}
      {!loading && !error && items.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statChip, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              {items.filter((i) => i.appointmentStatus === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: theme.colors.chipBg }]}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {items.filter((i) => i.appointmentStatus === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {items.filter((i) => i.appointmentStatus === 'completed').length}
            </Text>
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
                    <Text style={styles.title}>Property Visit</Text>
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
              {item.appointmentStatus === 'pending' || item.appointmentStatus === 'confirmed' ? (
                <View style={styles.actions}>
                  {item.appointmentStatus === 'pending' && (
                    <AppButton
                      label='Confirm'
                      icon='checkmark-outline'
                      onPress={() => updateStatus(item._id, 'confirmed')}
                      style={styles.actionBtn}
                    />
                  )}
                  <AppButton
                    label='Complete'
                    variant='secondary'
                    icon='checkmark-done-outline'
                    onPress={() => updateStatus(item._id, 'completed')}
                    style={styles.actionBtn}
                  />
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState title='No appointments' message='Appointment requests will appear here.' />
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  calendarIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  actionBtn: {
    flex: 1,
    height: 42,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
