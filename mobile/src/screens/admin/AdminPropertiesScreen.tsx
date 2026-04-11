import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { propertyApi } from '@/src/services/api/property.api';
import { Review, reviewApi } from '@/src/services/api/review.api';
import { theme } from '@/src/theme';
import { Property, PropertyStatus } from '@/src/types/property';
import { formatDate, formatLkr, getCoverImage } from '@/src/utils/format';
import { getStatusOptionsForListingType } from '@/src/utils/propertyRules';

export const AdminPropertiesScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [expandedReviewsPropertyId, setExpandedReviewsPropertyId] = useState<string | null>(null);
  const [reviewsLoadingPropertyId, setReviewsLoadingPropertyId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewsByProperty, setReviewsByProperty] = useState<Record<string, Review[]>>({});

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      try {
        const response = await propertyApi.getProperties(
          {
            search: query.trim() || undefined,
            page: 1,
            limit: 60,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          getTokenRef.current
        );
        setItems(response.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load properties');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [query]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (propertyId: string, status: PropertyStatus) => {
    setStatusUpdatingId(propertyId);
    try {
      const response = await propertyApi.updatePropertyStatus(propertyId, status, getTokenRef.current);
      setItems((prev) => prev.map((item) => (item._id === propertyId ? response.data : item)));
    } catch (e) {
      Alert.alert('Status update failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const deleteProperty = async (propertyId: string) => {
    setDeletingPropertyId(propertyId);
    try {
      await propertyApi.deleteProperty(propertyId, getTokenRef.current);
      setItems((prev) => prev.filter((item) => item._id !== propertyId));
      setExpandedReviewsPropertyId((prev) => (prev === propertyId ? null : prev));
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setDeletingPropertyId(null);
    }
  };

  const confirmDeleteProperty = (property: Property) => {
    Alert.alert(
      'Delete Property',
      `Delete "${property.title}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void deleteProperty(property._id) },
      ]
    );
  };

  const loadReviewsForProperty = async (property: Property) => {
    setReviewsLoadingPropertyId(property._id);
    try {
      const response = await reviewApi.getReviewsByProperty(property._id, getTokenRef.current);
      setReviewsByProperty((prev) => ({ ...prev, [property._id]: response.data || [] }));
    } catch (e) {
      Alert.alert('Reviews unavailable', e instanceof Error ? e.message : 'Unable to load reviews');
      setReviewsByProperty((prev) => ({ ...prev, [property._id]: [] }));
    } finally {
      setReviewsLoadingPropertyId(null);
    }
  };

  const toggleReviews = async (property: Property) => {
    if (expandedReviewsPropertyId === property._id) {
      setExpandedReviewsPropertyId(null);
      return;
    }

    setExpandedReviewsPropertyId(property._id);
    if (!reviewsByProperty[property._id]) {
      await loadReviewsForProperty(property);
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
      Alert.alert('Review delete failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderProperty = ({ item }: { item: Property }) => {
    const coverUrl = getCoverImage(item);
    const statusOptions = getStatusOptionsForListingType(item.listingType);
    const isBusy = statusUpdatingId === item._id || deletingPropertyId === item._id;
    const reviews = reviewsByProperty[item._id] || [];
    const reviewsExpanded = expandedReviewsPropertyId === item._id;
    const isRent = item.listingType === 'rent';

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Image
            source={coverUrl ? { uri: coverUrl } : undefined}
            style={styles.cardImage}
            contentFit='cover'
          />
          <View style={styles.cardMain}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta}>
              {item.city}
              {item.district ? `, ${item.district}` : ''}
            </Text>
            <Text style={styles.price}>{formatLkr(item.price)}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{item.listingType.toUpperCase()}</Text>
              </View>
              <View style={[styles.metaChip, styles.metaChipMuted]}>
                <Text style={styles.metaChipText}>{item.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((option) => (
            <Pressable
              key={option.value}
              disabled={isBusy}
              onPress={() => updateStatus(item._id, option.value)}
              style={({ pressed }) => [
                styles.statusPill,
                item.status === option.value && styles.statusPillActive,
                pressed && item.status !== option.value && styles.statusPillPressed,
                isBusy && styles.statusPillDisabled,
              ]}>
              <Text
                style={[
                  styles.statusPillText,
                  item.status === option.value && styles.statusPillTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.actionRow}>
          {isRent ? (
            <Pressable style={styles.actionBtn} onPress={() => void toggleReviews(item)}>
              <Ionicons name='chatbox-ellipses-outline' size={15} color={theme.colors.primary} />
              <Text style={styles.actionText}>{reviewsExpanded ? 'Hide Reviews' : 'View Reviews'}</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.actionBtn, styles.actionDanger]} onPress={() => confirmDeleteProperty(item)}>
            <Ionicons name='trash-outline' size={15} color={theme.colors.danger} />
            <Text style={styles.actionDangerText}>Delete Property</Text>
          </Pressable>
        </View>

        {reviewsExpanded ? (
          <View style={styles.reviewWrap}>
            {reviewsLoadingPropertyId === item._id ? (
              <Text style={styles.meta}>Loading reviews...</Text>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <View
                  key={review._id}
                  style={[
                    styles.reviewCard,
                    review.rating <= 2 && styles.reviewFlaggedCard,
                  ]}>
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
                        styles.reviewDeleteBtn,
                        pressed && styles.reviewDeletePressed,
                        deletingReviewId === review._id && styles.statusPillDisabled,
                      ]}>
                      <Ionicons name='trash-outline' size={14} color={theme.colors.danger} />
                      <Text style={styles.reviewDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>No reviews yet for this rent listing.</Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenWrapper scroll={false}>
      {/* Page header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Property Management</Text>
          <Text style={styles.pageSub}>Status changes, deletion & review moderation</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{items.length} listings</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name='search-outline' size={18} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder='Search by title, city or address...'
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType='search'
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name='close-circle' size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {loading ? <LoadingState message='Loading properties...' /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}

      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderProperty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
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
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
    maxWidth: 200,
  },
  countBadge: {
    backgroundColor: theme.colors.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  countBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    height: 48,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    height: '100%',
  },
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
  cardImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.chipBg,
  },
  cardMain: {
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
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  metaChip: {
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaChipMuted: {
    backgroundColor: theme.colors.chipBg,
  },
  metaChipText: {
    ...theme.typography.caption,
    color: '#fff',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusPillPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  statusPillDisabled: {
    opacity: 0.6,
  },
  statusPillText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  actionDanger: {
    borderColor: '#FED7D7',
    backgroundColor: '#FFF5F5',
  },
  actionText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  actionDangerText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
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
  reviewFlaggedCard: {
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
  reviewDeleteBtn: {
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
  reviewDeletePressed: {
    opacity: 0.85,
  },
  reviewDeleteText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    fontWeight: '600',
  },
});
