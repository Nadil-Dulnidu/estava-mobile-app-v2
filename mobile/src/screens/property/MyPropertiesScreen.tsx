import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View, Text } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { ConfirmModal } from '@/src/components/common/ConfirmModal';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { SearchBar } from '@/src/components/common/SearchBar';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { PropertyCard } from '@/src/components/property/PropertyCard';
import { propertyApi } from '@/src/services/api/property.api';
import { theme } from '@/src/theme';
import { Property } from '@/src/types/property';

export const MyPropertiesScreen = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetDelete, setTargetDelete] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Keep getToken in a ref — it's a new reference every render and would
  // cause an infinite loop if used directly in useCallback deps.
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; });

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const response = await propertyApi.getMyProperties(
        {
          search: query,
          page: 1,
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        getTokenRef.current,
      );
      setItems(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load your properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    if (!isLoaded) return;
    load();
  }, [isLoaded, load]);

  const remove = async () => {
    if (!targetDelete) return;

    setDeleting(true);
    try {
      await propertyApi.deleteProperty(targetDelete._id, getTokenRef.current);
      setItems((prev) => prev.filter((item) => item._id !== targetDelete._id));
      setTargetDelete(null);
      Alert.alert('Deleted', 'Property deleted permanently.');
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Listings</Text>
            <Text style={styles.headerSubtitle}>
              {user?.firstName ? `${user.firstName}'s listings` : 'Manage owned listings'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/properties/add')}
            style={styles.addIconBtn}
          >
            <Ionicons name='add' size={22} color={theme.colors.primaryContrast} />
          </Pressable>
        </View>

        {/* Stats */}
        {!loading && !error && items.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: theme.colors.chipBg }]}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {items.length}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {items.filter((i) => i.status === 'available').length}
              </Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#FFF8E1' }]}>
              <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                {items.filter((i) => i.status === 'sold' || i.status === 'rented').length}
              </Text>
              <Text style={styles.statLabel}>Sold/Rented</Text>
            </View>
          </View>
        )}

        <SearchBar value={query} onChangeText={setQuery} placeholder='Search your properties' />
        <AppButton label='Search' onPress={() => load()} variant='secondary' />

        {loading ? <LoadingState message='Loading your listings...' /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

        {!loading && !error ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => router.push(`/properties/${item._id}`)}
                onEdit={() => router.push(`/properties/${item._id}/edit`)}
                onDelete={() => setTargetDelete(item)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title='No properties yet'
                message='Create your first property listing to start managing inventory.'
              />
            }
            contentContainerStyle={styles.list}
          />
        ) : null}
      </View>

      <ConfirmModal
        visible={Boolean(targetDelete)}
        title='Delete property?'
        description='This action is permanent and cannot be undone.'
        confirmLabel='Delete permanently'
        loading={deleting}
        onCancel={() => setTargetDelete(null)}
        onConfirm={remove}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
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
  list: {
    paddingBottom: theme.spacing.xxl,
  },
});
