import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { adminApi, AdminDashboardSummary } from '@/src/services/api/admin.api';
import { theme } from '@/src/theme';

export const AdminDashboardScreen = () => {
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
      setError(e instanceof Error ? e.message : 'Failed to load admin summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ScreenWrapper>
      <AppHeader title='Admin Dashboard' subtitle='Platform overview and moderation health' />
      {loading ? <LoadingState message='Loading dashboard...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && summary ? (
        <View style={styles.grid}>
          {Object.entries(summary).map(([key, value]) => (
            <View key={key} style={styles.card}>
              <Text style={styles.value}>{value}</Text>
              <Text style={styles.label}>{key}</Text>
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
  },
  value: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
});
