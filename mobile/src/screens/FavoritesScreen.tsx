import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { AppButton } from '@/src/components/common/AppButton';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { favoriteApi, Favorite } from '@/src/services/api/favorite.api';
import { theme } from '@/src/theme';
import { formatLkr, getCoverImage } from '@/src/utils/format';
import { Property } from '@/src/types/property';
import { isCommercialPropertyType, isLandPropertyType, isResidentialPropertyType } from '@/src/utils/propertyRules';

export const FavoritesScreen = () => {
  const { isSignedIn } = useAppSession();
  const { getToken } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getTokenRef = useRef(getToken);

  // Safe ref update — never put getToken in effect deps
  getTokenRef.current = getToken;

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

  useEffect(() => { load(); }, [load]);

  const remove = async (favoriteId: string) => {
    try {
      await favoriteApi.removeFavorite(favoriteId, getTokenRef.current);
      setItems((prev) => prev.filter((item) => item._id !== favoriteId));
    } catch (error) {
      Alert.alert('Failed', error instanceof Error ? error.message : 'Unable to remove favorite');
    }
  };

  // Not signed in state
  if (!isSignedIn) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Properties</Text>
          <Text style={styles.headerSub}>Your curated property shortlist</Text>
        </View>
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <Ionicons name='heart-outline' size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.authTitle}>Sign in to view favorites</Text>
          <Text style={styles.authMsg}>
            Create an account to save properties and access them anytime from any device.
          </Text>
          <AppButton
            label='Sign In'
            icon='log-in-outline'
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Properties</Text>
          <Text style={styles.headerSub}>
            {items.length > 0 ? `${items.length} saved propert${items.length > 1 ? 'ies' : 'y'}` : 'Your curated shortlist'}
          </Text>
        </View>
        {items.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      {loading ? <LoadingState message='Loading your favorites...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const property = typeof item.propertyId === 'string' ? null : item.propertyId as unknown as Property;
            if (!property?._id) return null;
            const coverUrl = getCoverImage(property);

            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/properties/${property._id}`)}
              >
                <Image
                  source={coverUrl ? { uri: coverUrl } : undefined}
                  style={styles.cardImage}
                  contentFit='cover'
                  transition={200}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
                  <View style={styles.cardMeta}>
                    <Ionicons name='location-outline' size={11} color={theme.colors.textMuted} />
                    <Text style={styles.cardCity}>{property.city}</Text>
                  </View>
                  <Text style={styles.cardPrice}>{formatLkr(property.price)}</Text>
                  <View style={styles.cardChips}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{property.listingType.toUpperCase()}</Text>
                    </View>
                    {isResidentialPropertyType(property.propertyType) && property.bedrooms != null && (
                      <View style={styles.chip}>
                        <Ionicons name='bed-outline' size={10} color={theme.colors.primary} />
                        <Text style={styles.chipText}>{property.bedrooms} bd</Text>
                      </View>
                    )}
                    {isResidentialPropertyType(property.propertyType) && property.bathrooms != null && (
                      <View style={styles.chip}>
                        <Ionicons name='water-outline' size={10} color={theme.colors.primary} />
                        <Text style={styles.chipText}>{property.bathrooms} ba</Text>
                      </View>
                    )}
                    {isCommercialPropertyType(property.propertyType) && property.floorArea != null && (
                      <View style={styles.chip}>
                        <Ionicons name='resize-outline' size={10} color={theme.colors.primary} />
                        <Text style={styles.chipText}>Floor {property.floorArea}</Text>
                      </View>
                    )}
                    {isLandPropertyType(property.propertyType) && property.landSize != null && (
                      <View style={styles.chip}>
                        <Ionicons name='map-outline' size={10} color={theme.colors.primary} />
                        <Text style={styles.chipText}>Land {property.landSize}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => Alert.alert(
                    'Remove Favorite',
                    'Remove this property from your saved list?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => void remove(item._id) },
                    ]
                  )}
                  hitSlop={8}
                >
                  <Ionicons name='heart' size={20} color={theme.colors.danger} />
                </Pressable>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title='No saved properties'
              message='Browse listings and tap the heart icon to save properties here.'
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingTop: 4,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
  },
  headerSub: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countBadgeText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
    fontSize: 14,
  },
  // Not signed in
  authPrompt: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xxl,
  },
  authIconWrap: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  authTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
    textAlign: 'center',
  },
  authMsg: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
    lineHeight: 20,
  },
  // Cards
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadow.soft,
  },
  cardPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  cardImage: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.chipBg,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardCity: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  cardPrice: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
    fontSize: 14,
  },
  cardChips: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  chipText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
    fontFamily: 'Poppins-Regular',
  },
  removeBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
