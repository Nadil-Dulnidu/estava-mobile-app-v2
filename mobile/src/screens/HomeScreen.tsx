import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, SectionTitle } from '@/src/components/common/AppHeader';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { SearchBar } from '@/src/components/common/SearchBar';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { PropertyCard } from '@/src/components/property/PropertyCard';
import { propertyApi } from '@/src/services/api/property.api';
import { theme } from '@/src/theme';
import { Property } from '@/src/types/property';

export const HomeScreen = () => {
  const { isSignedIn, role } = useAppSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getPublicProperties({
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const featured = useMemo(() => properties.slice(0, 3), [properties]);
  const filteredRecent = useMemo(() => {
    if (!search.trim()) return properties;
    const needle = search.toLowerCase();
    return properties.filter((property) =>
      [property.title, property.city, property.address].some((text) => text.toLowerCase().includes(needle))
    );
  }, [properties, search]);

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <AppHeader title='Estava' subtitle='Find your next investment property' />
        <SearchBar value={search} onChangeText={setSearch} placeholder='Search by city, title or address' />

        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push(isSignedIn ? '/(user)/explore' : '/(public)/listings')}>
            <Text style={styles.quickTitle}>Browse Listings</Text>
          </Pressable>
          <Pressable
            style={styles.quickAction}
            onPress={() => {
              if (!isSignedIn) {
                router.push('/(auth)/sign-in');
                return;
              }

              if (role === 'owner' || role === 'admin') {
                router.push('/properties/add');
                return;
              }

              router.push('/(user)/profile');
            }}>
            <Text style={styles.quickTitle}>Post Property</Text>
          </Pressable>
        </View>

        {loading ? <LoadingState message='Loading market overview...' /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error ? (
          <FlatList
            data={filteredRecent}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <>
                <SectionTitle title='Featured' />
                <FlatList
                  horizontal
                  data={featured}
                  keyExtractor={(item) => `${item._id}-featured`}
                  renderItem={({ item }) => (
                    <View style={styles.featuredCard}>
                      <PropertyCard property={item} onPress={() => router.push(`/properties/${item._id}`)} />
                    </View>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
                <SectionTitle title='Latest Listings' />
              </>
            }
            renderItem={({ item }) => (
              <PropertyCard property={item} onPress={() => router.push(`/properties/${item._id}`)} />
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : null}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  quickTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  featuredCard: {
    width: 300,
    marginRight: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
