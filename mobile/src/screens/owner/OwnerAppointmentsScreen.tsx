import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { appointmentApi } from '@/src/services/api/appointment.api';
import { Appointment } from '@/src/types/appointment';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';

export const OwnerAppointmentsScreen = () => {
  const { getToken } = useAuth();
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
      <AppHeader title='Owner Appointments' subtitle='Manage visit schedules' />
      {loading ? <LoadingState message='Loading appointments...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>Visit scheduled</Text>
              <Text style={styles.meta}>Date: {formatDate(item.appointmentDateTime)}</Text>
              <Text style={styles.meta}>Status: {item.appointmentStatus}</Text>
              <View style={styles.actions}>
                <AppButton label='Confirm' variant='secondary' onPress={() => updateStatus(item._id, 'confirmed')} />
                <AppButton label='Complete' variant='secondary' onPress={() => updateStatus(item._id, 'completed')} />
              </View>
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
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  title: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  meta: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
