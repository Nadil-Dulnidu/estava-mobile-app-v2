import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ErrorState, LoadingState } from "@/src/components/common/StateViews";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { useResponsive } from "@/src/hooks/useResponsive";
import { adminApi, AdminDashboardAnalytics, AdminDashboardDistributionPoint, AdminDashboardSummary } from "@/src/services/api/admin.api";
import { theme } from "@/src/theme";

const STAT_CARDS = (summary: AdminDashboardSummary) => [
  { label: "Total Listings", value: summary.totalProperties, icon: "business" as const, bg: theme.colors.primary },
  { label: "Recent Listings", value: summary.recentProperties, icon: "trending-up" as const, bg: "#1565C0" },
  { label: "Appointments", value: summary.totalAppointments, icon: "calendar" as const, bg: "#6A1B9A" },
  { label: "Inquiries", value: summary.totalInquiries, icon: "chatbox-ellipses" as const, bg: theme.colors.success },
];

export const AdminDashboardScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const { isTablet, numCols } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);

  getTokenRef.current = getToken;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResponse, analyticsResponse] = await Promise.all([adminApi.getDashboardSummary(getTokenRef.current), adminApi.getDashboardAnalytics({ days: 14 }, getTokenRef.current)]);
      setSummary(summaryResponse.data);
      setAnalytics(analyticsResponse.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cols = numCols(2, 4, 4);
  const cardFlex = `${Math.floor(100 / cols) - 1}%` as any;

  const listingDailyMax = Math.max(...(analytics?.dailyListings || []).map((item) => item.count), 1);
  const statusTotal = (analytics?.byStatus || []).reduce((acc, item) => acc + item.count, 0);
  const availableCount = (analytics?.byStatus || []).find((item) => item.label === "available")?.count || 0;
  const availabilityPercent = statusTotal > 0 ? Math.round((availableCount / statusTotal) * 100) : 0;

  const renderDistribution = (title: string, data: AdminDashboardDistributionPoint[], barColor: string) => {
    const max = Math.max(...data.map((item) => item.count), 1);
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartSectionTitle}>{title}</Text>
        {data.map((item) => (
          <View key={`${title}-${item.label}`} style={styles.distRow}>
            <Text style={styles.distLabel}>{item.label}</Text>
            <View style={styles.distTrack}>
              <View style={[styles.distBar, { width: `${Math.max((item.count / max) * 100, 6)}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={styles.distCount}>{item.count}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Admin Dashboard</Text>
          <Text style={styles.pageSub}>Platform health and listing intelligence</Text>
        </View>
      </View>

      {loading ? <LoadingState message="Loading dashboard..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && summary && analytics ? (
        <View style={styles.content}>
          {/* Stat grid */}
          <View style={[styles.statGrid, { gap: isTablet ? theme.spacing.md : theme.spacing.sm }]}>
            {STAT_CARDS(summary).map((card) => (
              <View key={card.label} style={[styles.statCard, { flexBasis: cardFlex, backgroundColor: card.bg }]}>
                <View style={styles.statIconWrap}>
                  <Ionicons name={card.icon} size={20} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))}
          </View>

          {/* Availability gauge */}
          <View style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <View style={styles.chartTitleRow}>
                <Ionicons name="radio-button-on" size={14} color={theme.colors.primary} />
                <Text style={styles.chartSectionTitle}>Availability Gauge</Text>
              </View>
              <Text style={styles.gaugePercent}>{availabilityPercent}%</Text>
            </View>
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${availabilityPercent}%` }]} />
            </View>
            <Text style={styles.hint}>Available listings as a % of all statuses</Text>
          </View>

          {/* Daily bar chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="bar-chart-outline" size={14} color={theme.colors.primary} />
              <Text style={styles.chartSectionTitle}>Listings by Day (14 days)</Text>
            </View>
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
            <Text style={styles.hint}>Each bar represents total listings created on that day.</Text>
          </View>

          {/* Distribution cards */}
          {renderDistribution("Listings by Type", analytics.byType, "#2563EB")}
          {renderDistribution("Listings by Status", analytics.byStatus, theme.colors.primary)}

          {/* Review health */}
          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="star-outline" size={14} color={theme.colors.warning} />
              <Text style={styles.chartSectionTitle}>Review Health</Text>
            </View>
            <View style={styles.reviewMetricsGrid}>
              <View style={[styles.reviewMetricCard, { borderColor: theme.colors.border }]}>
                <Text style={styles.reviewMetricValue}>{analytics.reviewMetrics.totalReviews}</Text>
                <Text style={styles.reviewMetricLabel}>Total Reviews</Text>
              </View>
              <View style={[styles.reviewMetricCard, { borderColor: "#D97706" }]}>
                <Text style={[styles.reviewMetricValue, { color: "#D97706" }]}>{analytics.reviewMetrics.averageRating.toFixed(1)}★</Text>
                <Text style={styles.reviewMetricLabel}>Avg Rating</Text>
              </View>
              <View style={[styles.reviewMetricCard, { borderColor: theme.colors.danger }]}>
                <Text style={[styles.reviewMetricValue, { color: theme.colors.danger }]}>{analytics.reviewMetrics.lowRatingCount}</Text>
                <Text style={styles.reviewMetricLabel}>Low (≤2★)</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1565C0",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  adminBadgeText: {
    ...theme.typography.caption,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  content: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCard: {
    flexGrow: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 6,
    ...theme.shadow.soft,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
    lineHeight: 28,
  },
  statLabel: {
    ...theme.typography.caption,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 16,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chartSectionTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  gaugePercent: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  gaugeTrack: {
    height: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    overflow: "hidden",
    marginVertical: 4,
  },
  gaugeFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  dailyChartWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 120,
    marginVertical: 4,
  },
  dailyBarCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  dailyBarTrack: {
    height: 96,
    width: "60%",
    minWidth: 8,
    maxWidth: 20,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  dailyBar: {
    width: "100%",
    backgroundColor: "#2563EB",
    borderRadius: theme.radius.full,
  },
  dailyBarLabel: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontFamily: "Poppins-Regular",
    fontWeight: "500",
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  distLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    width: 80,
    textTransform: "capitalize",
  },
  distTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    overflow: "hidden",
  },
  distBar: {
    height: "100%",
    borderRadius: theme.radius.full,
  },
  distCount: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
  reviewMetricsGrid: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  reviewMetricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.background,
  },
  reviewMetricValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: theme.colors.accentDark,
  },
  reviewMetricLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
