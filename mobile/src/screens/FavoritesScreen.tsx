import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { PropertyCard } from '@/src/components/property/PropertyCard';
import { useAppSession } from '@/src/context/AppSessionContext';
import { favoriteApi, Favorite } from '@/src/services/api/favorite.api';
import { theme } from '@/src/theme';

export const FavoritesScreen = () => {
  const { isSignedIn } = useAppSession();
  const { getToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await favoriteApi.getMyFavorites(getTokenRef.current);
      setItems(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (favoriteId: string) => {
    try {
      await favoriteApi.removeFavorite(favoriteId, getTokenRef.current);
      setItems((prev) => prev.filter((item) => item._id !== favoriteId));
    } catch (error) {
      Alert.alert('Failed', error instanceof Error ? error.message : 'Unable to remove favorite');
    }
  };

  if (!isSignedIn) {
    return (
      <ScreenWrapper>
        <AppHeader title='Favorites' subtitle='Sign in to save and manage favorites' />
        <EmptyState title='Sign in required' message='Create an account to manage your saved properties.' />
        <AppButton label='Go to Sign In' onPress={() => router.push('/(auth)/sign-in')} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title='Favorites' subtitle='Saved properties for quick access' />
      {loading ? <LoadingState message='Loading favorites...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const property = typeof item.propertyId === 'string' ? null : item.propertyId;
            if (!property?._id) return null;

            return (
              <View style={styles.favoriteItem}>
                <PropertyCard
                  property={property as any}
                  onPress={() => router.push(`/properties/${property._id}`)}
                />
                <AppButton label='Remove' variant='secondary' onPress={() => remove(item._id)} />
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title='No favorites yet'
              message='Save properties from the listing screen to access them quickly.'
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  favoriteItem: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
