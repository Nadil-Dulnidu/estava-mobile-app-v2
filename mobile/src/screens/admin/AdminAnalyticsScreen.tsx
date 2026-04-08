import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { adminApi, AdminDashboardSummary } from '@/src/services/api/admin.api';
import { theme } from '@/src/theme';

export const AdminAnalyticsScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboardSummary(getTokenRef.current);
      setSummary(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScreenWrapper>
      <AppHeader title='Analytics' subtitle='Live platform metrics' />
      {loading ? <LoadingState message='Loading analytics...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && summary ? (
        <View style={styles.chartCard}>
          <Text style={styles.title}>Listings moderation ratio</Text>
          <Text style={styles.metric}>
            Approved {summary.approvedProperties} / Rejected {summary.rejectedProperties}
          </Text>
          <Text style={styles.metric}>Pending moderation: {summary.pendingModeration}</Text>
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  metric: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
