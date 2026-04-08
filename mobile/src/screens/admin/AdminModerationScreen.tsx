import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { adminApi } from '@/src/services/api/admin.api';
import { Property } from '@/src/types/property';
import { theme } from '@/src/theme';

export const AdminModerationScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Property[]>([]);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getModerationProperties(getTokenRef.current);
      setItems(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, moderationStatus: 'approved' | 'rejected') => {
    const response = await adminApi.moderateProperty(id, { moderationStatus }, getTokenRef.current);
    setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
  };

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title='Property Moderation' subtitle='Approve or reject listings' />
      {loading ? <LoadingState message='Loading moderation queue...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>Moderation: {(item as any).moderationStatus || 'pending'}</Text>
              <View style={styles.actions}>
                <AppButton label='Approve' variant='secondary' onPress={() => moderate(item._id, 'approved')} />
                <AppButton label='Reject' variant='danger' onPress={() => moderate(item._id, 'rejected')} />
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState title='No moderation items' message='Queue is currently empty.' />}
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
