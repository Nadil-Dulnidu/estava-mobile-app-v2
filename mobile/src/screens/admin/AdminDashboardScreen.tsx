import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import {
  adminApi,
  AdminDashboardAnalytics,
  AdminDashboardDistributionPoint,
  AdminDashboardSummary,
} from '@/src/services/api/admin.api';
import { theme } from '@/src/theme';

export const AdminDashboardScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, analyticsResponse] = await Promise.all([
        adminApi.getDashboardSummary(getTokenRef.current),
        adminApi.getDashboardAnalytics({ days: 14 }, getTokenRef.current),
      ]);
      setSummary(summaryResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const listingDailyMax =
    Math.max(...(analytics?.dailyListings || []).map((item) => item.count), 1);
  const statusTotal = (analytics?.byStatus || []).reduce((acc, item) => acc + item.count, 0);
  const availableCount = (analytics?.byStatus || []).find((item) => item.label === 'available')?.count || 0;
  const availabilityPercent = statusTotal > 0 ? Math.round((availableCount / statusTotal) * 100) : 0;

  const renderDistribution = (
    title: string,
    data: AdminDashboardDistributionPoint[],
    barColor: string
  ) => {
    const max = Math.max(...data.map((item) => item.count), 1);
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        {data.map((item) => (
          <View key={`${title}-${item.label}`} style={styles.distributionRow}>
            <Text style={styles.distributionLabel}>{item.label}</Text>
            <View style={styles.distributionTrack}>
              <View
                style={[
                  styles.distributionBar,
                  { width: `${Math.max((item.count / max) * 100, 6)}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={styles.distributionCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <AppHeader title='Admin Dashboard' subtitle='Platform health and listing intelligence' />
      {loading ? <LoadingState message='Loading dashboard...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && summary && analytics ? (
        <View style={styles.content}>
          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.value}>{summary.totalProperties}</Text>
              <Text style={styles.label}>Total listings</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.value}>{summary.recentProperties}</Text>
              <Text style={styles.label}>New listings (period)</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.value}>{summary.totalAppointments}</Text>
              <Text style={styles.label}>Appointments</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.value}>{summary.totalInquiries}</Text>
              <Text style={styles.label}>Inquiries</Text>
            </View>
          </View>

          <View style={styles.gaugeCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.gaugeTitle}>Availability Gauge</Text>
              <Text style={styles.gaugeValue}>{availabilityPercent}%</Text>
            </View>
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${availabilityPercent}%` }]} />
            </View>
            <Text style={styles.gaugeHint}>Available listings as a percentage of all statuses</Text>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Listings by Day (14 days)</Text>
            <View style={styles.dailyChartWrap}>
              {(analytics.dailyListings || []).map((item) => {
                const heightPercent = Math.max((item.count / listingDailyMax) * 100, item.count > 0 ? 8 : 2);
                return (
                  <View key={item.date} style={styles.dailyBarCol}>
                    <View style={styles.dailyBarTrack}>
                      <View style={[styles.dailyBar, { height: `${heightPercent}%` }]} />
                    </View>
                    <Text style={styles.dailyBarLabel}>{item.date.slice(5)}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.gaugeHint}>Each bar shows total listings created on that day.</Text>
          </View>

          {renderDistribution('Listings by Type', analytics.byType, '#2563EB')}
          {renderDistribution('Listings by Status', analytics.byStatus, '#2E7D32')}

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Review Health</Text>
            <View style={styles.reviewMetricsRow}>
              <Text style={styles.metric}>Total reviews: {analytics.reviewMetrics.totalReviews}</Text>
              <Text style={styles.metric}>Average rating: {analytics.reviewMetrics.averageRating.toFixed(2)}★</Text>
              <Text style={styles.metric}>{`Low ratings (<=2): ${analytics.reviewMetrics.lowRatingCount}`}</Text>
            </View>
          </View>
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  card: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    ...theme.shadow.soft,
  },
  value: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
    fontSize: 20,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    gap: 8,
    ...theme.shadow.soft,
  },
  gaugeTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  gaugeValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  gaugeTrack: {
    height: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  gaugeHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
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
  chartTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  dailyChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 130,
    marginTop: 4,
  },
  dailyBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dailyBarTrack: {
    height: 106,
    width: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dailyBar: {
    width: '100%',
    backgroundColor: '#2563EB',
    borderRadius: theme.radius.full,
  },
  dailyBarLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    fontSize: 9,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distributionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    width: 84,
    textTransform: 'capitalize',
  },
  distributionTrack: {
    flex: 1,
    height: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  distributionCount: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    width: 28,
    textAlign: 'right',
  },
  reviewMetricsRow: {
    gap: 4,
  },
  metric: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
