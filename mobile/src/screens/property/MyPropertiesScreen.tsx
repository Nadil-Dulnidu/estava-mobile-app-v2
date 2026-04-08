import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
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
        <AppHeader
          title='My Properties'
          subtitle={user?.firstName ? `${user.firstName}'s listings` : 'Manage owned listings'}
          right={
            <AppButton label='Add' onPress={() => router.push('/properties/add')} style={styles.addBtn} />
          }
        />

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
  addBtn: {
    width: 76,
    height: 40,
  },
  list: {
    paddingBottom: theme.spacing.xxl,
  },
});
