import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { adminApi, AdminDashboardAnalytics } from '@/src/services/api/admin.api';
import { theme } from '@/src/theme';

export const AdminAnalyticsScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboardAnalytics({ days: 30 }, getTokenRef.current);
      setAnalytics(response.data);
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
      <AppHeader title='Analytics' subtitle='30-day trend breakdown' />
      {loading ? <LoadingState message='Loading analytics...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && analytics ? (
        <View style={styles.wrap}>
          <View style={styles.chartCard}>
            <Text style={styles.title}>Listing Type Mix</Text>
            {analytics.byType.map((item) => (
              <View key={item.label} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.title}>Status Mix</Text>
            {analytics.byStatus.map((item) => (
              <View key={item.label} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValue}>{item.count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.title}>Review Risk Signals</Text>
            <Text style={styles.metric}>Total reviews: {analytics.reviewMetrics.totalReviews}</Text>
            <Text style={styles.metric}>Average rating: {analytics.reviewMetrics.averageRating.toFixed(2)}★</Text>
            <Text style={styles.metric}>{`Low ratings (<=2): ${analytics.reviewMetrics.lowRatingCount}`}</Text>
          </View>
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  chartCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  metricValue: {
    ...theme.typography.bodyStrong,
    color: theme.colors.accentDark,
  },
  metric: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
