import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { adminApi, AdminDashboardAnalytics } from '@/src/services/api/admin.api';
import { theme } from '@/src/theme';

const STATUS_COLORS: Record<string, string> = {
  available: theme.colors.success,
  sold: '#1565C0',
  rented: '#6A1B9A',
  unavailable: theme.colors.textMuted,
};

const TYPE_COLORS: Record<string, string> = {
  house: theme.colors.primary,
  apartment: '#1565C0',
  land: '#D97706',
  commercial: '#6A1B9A',
};

export const AdminAnalyticsScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);

  getTokenRef.current = getToken;

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

  useEffect(() => { load(); }, []);

  const renderBarChart = (
    title: string,
    data: { label: string; count: number }[],
    colorMap: Record<string, string>,
    defaultColor: string
  ) => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name='pie-chart-outline' size={16} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        {data.map((item) => {
          const color = colorMap[item.label] ?? defaultColor;
          const pct = Math.max((item.count / max) * 100, item.count > 0 ? 6 : 0);
          return (
            <View key={item.label} style={styles.barRow}>
              <View style={styles.barLabelWrap}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={styles.barLabel}>{item.label}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
              <View style={styles.barCountWrap}>
                <Text style={styles.barCount}>{item.count}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Analytics</Text>
          <Text style={styles.pageSub}>30-day trend breakdown</Text>
        </View>
        <View style={styles.periodBadge}>
          <Ionicons name='calendar-outline' size={12} color={theme.colors.primary} />
          <Text style={styles.periodText}>Last 30 days</Text>
        </View>
      </View>

      {loading ? <LoadingState message='Loading analytics...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && analytics ? (
        <View style={styles.content}>
          {renderBarChart('Listing Type Mix', analytics.byType, TYPE_COLORS, theme.colors.primary)}
          {renderBarChart('Status Mix', analytics.byStatus, STATUS_COLORS, theme.colors.textMuted)}

          {/* Review risk */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name='warning-outline' size={16} color={theme.colors.warning} />
              <Text style={styles.cardTitle}>Review Risk Signals</Text>
            </View>
            <View style={styles.reviewGrid}>
              <View style={[styles.reviewMetric, { borderColor: theme.colors.border }]}>
                <Text style={styles.reviewMetricVal}>{analytics.reviewMetrics.totalReviews}</Text>
                <Text style={styles.reviewMetricLbl}>Total Reviews</Text>
              </View>
              <View style={[styles.reviewMetric, { borderColor: '#D97706' }]}>
                <Text style={[styles.reviewMetricVal, { color: '#D97706' }]}>
                  {analytics.reviewMetrics.averageRating.toFixed(1)}★
                </Text>
                <Text style={styles.reviewMetricLbl}>Avg Rating</Text>
              </View>
              <View style={[styles.reviewMetric, { borderColor: theme.colors.danger }]}>
                <Text style={[styles.reviewMetricVal, { color: theme.colors.danger }]}>
                  {analytics.reviewMetrics.lowRatingCount}
                </Text>
                <Text style={styles.reviewMetricLbl}>Low (≤2★)</Text>
              </View>
            </View>
            {analytics.reviewMetrics.lowRatingCount > 0 && (
              <View style={styles.riskBanner}>
                <Ionicons name='alert-circle' size={14} color={theme.colors.danger} />
                <Text style={styles.riskText}>
                  {analytics.reviewMetrics.lowRatingCount} listing(s) have low-rated reviews that may need moderation.
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingTop: 4,
  },
  pageTitle: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
  },
  pageSub: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  periodText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 2,
  },
  cardTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    flex: 1,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  barCountWrap: {
    width: 32,
    alignItems: 'flex-end',
  },
  barCount: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  reviewGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  reviewMetric: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.background,
  },
  reviewMetricVal: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    color: theme.colors.accentDark,
  },
  reviewMetricLbl: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  riskText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    flex: 1,
    lineHeight: 16,
  },
});
