import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '@/src/components/common/AppHeader';
import { SearchBar } from '@/src/components/common/SearchBar';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { propertyApi } from '@/src/services/api/property.api';
import { Review, reviewApi } from '@/src/services/api/review.api';
import { theme } from '@/src/theme';
import { Property } from '@/src/types/property';
import { formatDate, formatLkr, getCoverImage } from '@/src/utils/format';

export const AdminReviewsScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [reviewsLoadingPropertyId, setReviewsLoadingPropertyId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewsByProperty, setReviewsByProperty] = useState<Record<string, Review[]>>({});

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const loadProperties = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      try {
        const response = await propertyApi.getProperties(
          {
            listingType: 'rent',
            search: query.trim() || undefined,
            page: 1,
            limit: 80,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          getTokenRef.current
        );
        setItems(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load rent properties');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query]
  );

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const loadReviews = async (propertyId: string) => {
    setReviewsLoadingPropertyId(propertyId);
    try {
      const response = await reviewApi.getReviewsByProperty(propertyId, getTokenRef.current);
      setReviewsByProperty((prev) => ({ ...prev, [propertyId]: response.data || [] }));
    } catch (e) {
      Alert.alert('Reviews unavailable', e instanceof Error ? e.message : 'Unable to load reviews');
      setReviewsByProperty((prev) => ({ ...prev, [propertyId]: [] }));
    } finally {
      setReviewsLoadingPropertyId(null);
    }
  };

  const togglePropertyReviews = async (propertyId: string) => {
    if (expandedPropertyId === propertyId) {
      setExpandedPropertyId(null);
      return;
    }

    setExpandedPropertyId(propertyId);
    if (!reviewsByProperty[propertyId]) {
      await loadReviews(propertyId);
    }
  };

  const deleteReview = async (propertyId: string, reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      await reviewApi.deleteReview(reviewId, getTokenRef.current);
      setReviewsByProperty((prev) => ({
        ...prev,
        [propertyId]: (prev[propertyId] || []).filter((review) => review._id !== reviewId),
      }));
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unable to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const reviews = reviewsByProperty[item._id] || [];
    const isExpanded = expandedPropertyId === item._id;
    const coverUrl = getCoverImage(item);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Image source={coverUrl ? { uri: coverUrl } : undefined} style={styles.image} contentFit='cover' />
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta}>{item.city}{item.district ? `, ${item.district}` : ''}</Text>
            <Text style={styles.price}>{formatLkr(item.price)}</Text>
          </View>
        </View>

        <Pressable style={styles.toggleBtn} onPress={() => void togglePropertyReviews(item._id)}>
          <Ionicons name={isExpanded ? 'chevron-up-outline' : 'chatbox-ellipses-outline'} size={15} color={theme.colors.primary} />
          <Text style={styles.toggleText}>{isExpanded ? 'Hide Reviews' : 'View Reviews'}</Text>
        </Pressable>

        {isExpanded ? (
          <View style={styles.reviewWrap}>
            {reviewsLoadingPropertyId === item._id ? (
              <Text style={styles.meta}>Loading reviews...</Text>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review._id} style={[styles.reviewCard, review.rating <= 2 && styles.reviewFlagged]}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.reviewUser}>{review.userName || `User ${review.userId.slice(-6)}`}</Text>
                    <Text style={[styles.reviewRating, review.rating <= 2 && styles.reviewRatingLow]}>
                      {'★'.repeat(review.rating)}
                      {'☆'.repeat(5 - review.rating)}
                    </Text>
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                  <View style={styles.rowBetween}>
                    <Text style={styles.meta}>Updated {formatDate(review.updatedAt)}</Text>
                    <Pressable
                      onPress={() => void deleteReview(item._id, review._id)}
                      disabled={deletingReviewId === review._id}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && styles.deleteBtnPressed,
                        deletingReviewId === review._id && styles.disabled,
                      ]}>
                      <Ionicons name='trash-outline' size={14} color={theme.colors.danger} />
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>No reviews yet for this property.</Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title='Review Management' subtitle='Moderate rent-property reviews by listing' />
      <SearchBar value={query} onChangeText={setQuery} placeholder='Search rent properties' />

      {loading ? <LoadingState message='Loading rent listings...' /> : null}
      {error ? <ErrorState message={error} onRetry={() => loadProperties()} /> : null}

      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderProperty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadProperties(true)}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  image: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  price: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
    fontSize: 14,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    height: 40,
    backgroundColor: theme.colors.background,
  },
  toggleText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  reviewWrap: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.xs,
  },
  reviewCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: 4,
  },
  reviewFlagged: {
    borderColor: '#FEB2B2',
    backgroundColor: '#FFF5F5',
  },
  reviewUser: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  reviewRating: {
    ...theme.typography.caption,
    color: '#D97706',
    letterSpacing: 1,
  },
  reviewRatingLow: {
    color: theme.colors.danger,
  },
  reviewComment: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#FED7D7',
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF5F5',
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
