import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { appointmentApi } from '@/src/services/api/appointment.api';
import { inquiryApi } from '@/src/services/api/inquiry.api';
import { propertyApi } from '@/src/services/api/property.api';
import { theme } from '@/src/theme';

export const OwnerDashboardScreen = () => {
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ properties: 0, inquiries: 0, appointments: 0 });

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
      const [properties, inquiries, appointments] = await Promise.all([
        propertyApi.getMyProperties({ page: 1, limit: 1 }, getTokenRef.current),
        inquiryApi.getMyReceivedInquiries(userId, getTokenRef.current),
        appointmentApi.getMyReceivedAppointments(userId, { page: 1, limit: 1 }, getTokenRef.current),
      ]);

      setStats({
        properties: properties.meta?.total || properties.data.length,
        inquiries: inquiries.meta?.total || inquiries.data.length,
        appointments: appointments.meta?.total || appointments.data.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = useMemo(
    () => [
      { label: 'My Listings', value: stats.properties },
      { label: 'Inquiries', value: stats.inquiries },
      { label: 'Appointments', value: stats.appointments },
    ],
    [stats]
  );

  return (
    <ScreenWrapper>
      <AppHeader title='Owner Dashboard' subtitle='Overview of your listing activity' />
      {loading ? <LoadingState message='Loading owner dashboard...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <View style={styles.grid}>
          {cards.map((card) => (
            <View key={card.label} style={styles.card}>
              <Text style={styles.value}>{card.value}</Text>
              <Text style={styles.label}>{card.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  card: {
    flexBasis: '48%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  value: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
