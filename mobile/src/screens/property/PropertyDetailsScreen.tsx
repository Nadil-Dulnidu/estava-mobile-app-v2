import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { ConfirmModal } from '@/src/components/common/ConfirmModal';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { StatusBadge } from '@/src/components/property/StatusBadge';
import { useAppSession } from '@/src/context/AppSessionContext';
import { favoriteApi } from '@/src/services/api/favorite.api';
import { propertyApi } from '@/src/services/api/property.api';
import { Review, reviewApi } from '@/src/services/api/review.api';
import { theme } from '@/src/theme';
import { Property, PropertyStatus } from '@/src/types/property';
import { formatDate, formatLkr, resolvePropertyImageUrl } from '@/src/utils/format';
import {
  getStatusOptionsForListingType,
  isCommercialPropertyType,
  isLandPropertyType,
  isResidentialPropertyType,
} from '@/src/utils/propertyRules';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 40;
const STATUS_ICON: Record<PropertyStatus, keyof typeof Ionicons.glyphMap> = {
  available: 'checkmark-circle-outline',
  sold: 'cash-outline',
  rented: 'key-outline',
  unavailable: 'pause-circle-outline',
};

export const PropertyDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { isSignedIn, isAdmin, user } = useAppSession();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  // Keep getToken in a ref — it's a new reference every render and would
  // cause an infinite loop if used directly in useCallback deps.
  const getTokenRef = useRef(getToken);
  useEffect(() => { getTokenRef.current = getToken; });

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      let response;
      if (isSignedIn) {
        try {
          response = await propertyApi.getPropertyById(id, getTokenRef.current);
        } catch {
          response = await propertyApi.getPublicPropertyById(id);
        }
      } else {
        response = await propertyApi.getPublicPropertyById(id);
      }
      setProperty(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  }, [id, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await propertyApi.deleteProperty(id, getTokenRef.current);
      Alert.alert('Deleted', 'Property deleted permanently.');
      setShowDelete(false);
      router.back();
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setDeleting(false);
    }
  };

  const onChangeStatus = async (status: PropertyStatus) => {
    if (!id) return;

    try {
      setStatusUpdating(true);
      const response = await propertyApi.updatePropertyStatus(id, status, getTokenRef.current);
      setProperty(response.data);
    } catch (e) {
      Alert.alert('Status update failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setStatusUpdating(false);
    }
  };

  const loadReviews = useCallback(async () => {
    if (!id || property?.listingType !== 'rent') {
      setReviews([]);
      setReviewCount(0);
      setAverageRating(0);
      return;
    }

    setReviewsLoading(true);
    try {
      const response = await reviewApi.getReviewsByProperty(
        id,
        isSignedIn ? getTokenRef.current : undefined
      );
      setReviews(response.data || []);
      setReviewCount(Number(response.meta?.reviewCount || response.data?.length || 0));
      setAverageRating(Number(response.meta?.averageRating || 0));
    } catch (e) {
      setReviews([]);
      setReviewCount(0);
      setAverageRating(0);
      Alert.alert('Reviews unavailable', e instanceof Error ? e.message : 'Unable to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [id, isSignedIn, property?.listingType]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property?._id]);

  const loadFavorite = useCallback(async () => {
    if (!id || !isSignedIn) {
      setFavoriteId(null);
      return;
    }

    try {
      const response = await favoriteApi.getMyFavorites(getTokenRef.current);
      const next = (response.data || []).find((item) => {
        const propertyId =
          typeof item.propertyId === 'string' ? item.propertyId : item.propertyId?._id;
        return propertyId === id;
      });
      setFavoriteId(next?._id || null);
    } catch {
      setFavoriteId(null);
    }
  }, [id, isSignedIn]);

  useEffect(() => {
    void loadFavorite();
  }, [loadFavorite]);

  const myReview = reviews.find((review) => review.userId === userId);

  useEffect(() => {
    if (!myReview) {
      setReviewRating(5);
      setReviewComment('');
      return;
    }

    setReviewRating(myReview.rating);
    setReviewComment(myReview.comment || '');
  }, [myReview]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <LoadingState message='Loading property details...' />
      </ScreenWrapper>
    );
  }

  if (error || !property) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        <ErrorState message={error || 'Unable to load'} onRetry={load} />
      </ScreenWrapper>
    );
  }

  const canManage = isSignedIn && (isAdmin || property.createdBy === userId);
  const isLand = isLandPropertyType(property.propertyType);
  const isCommercial = isCommercialPropertyType(property.propertyType);
  const isResidential = isResidentialPropertyType(property.propertyType);
  const statusOptions = getStatusOptionsForListingType(property.listingType);
  const canReview =
    isSignedIn &&
    property.listingType === 'rent' &&
    Boolean(userId) &&
    property.createdBy !== userId;

  const reviewerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.fullName || undefined;

  const saveReview = async () => {
    if (!id) return;
    if (!canReview) {
      if (!isSignedIn) router.push('/(auth)/sign-in');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Invalid rating', 'Please choose a rating between 1 and 5 stars.');
      return;
    }

    const normalizedComment = reviewComment.trim();
    if (normalizedComment.length > 0 && normalizedComment.length < 3) {
      Alert.alert('Review too short', 'Comment should be at least 3 characters, or leave it empty.');
      return;
    }

    setReviewSubmitting(true);
    try {
      if (myReview?._id) {
        await reviewApi.updateReview(
          myReview._id,
          { rating: reviewRating, comment: normalizedComment || undefined },
          getTokenRef.current
        );
      } else {
        await reviewApi.createReview(
          {
            propertyId: id,
            rating: reviewRating,
            comment: normalizedComment || undefined,
            userName: reviewerName,
          },
          getTokenRef.current
        );
      }

      await loadReviews();
      Alert.alert('Success', myReview ? 'Review updated successfully.' : 'Review posted successfully.');
    } catch (e) {
      Alert.alert('Review failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const deleteMyReview = async () => {
    if (!myReview?._id) return;

    setReviewSubmitting(true);
    try {
      await reviewApi.deleteReview(myReview._id, getTokenRef.current);
      await loadReviews();
      setReviewRating(5);
      setReviewComment('');
      Alert.alert('Removed', 'Your review was deleted.');
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Please try again');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const onToggleFavorite = async () => {
    if (!id) return;

    if (!isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }

    setFavoriteBusy(true);
    try {
      if (favoriteId) {
        await favoriteApi.removeFavorite(favoriteId, getTokenRef.current);
        setFavoriteId(null);
      } else {
        const response = await favoriteApi.addFavorite(id, getTokenRef.current);
        setFavoriteId(response.data._id);
      }
    } catch (e) {
      Alert.alert('Favorite failed', e instanceof Error ? e.message : 'Please try again');
      await loadFavorite();
    } finally {
      setFavoriteBusy(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Property Details</Text>
        <Pressable
          onPress={() => void onToggleFavorite()}
          disabled={favoriteBusy}
          style={({ pressed }) => [
            styles.favoriteBtn,
            pressed && styles.favoriteBtnPressed,
            favoriteBusy && styles.favoriteBtnDisabled,
          ]}>
          <Ionicons
            name={favoriteId ? 'heart' : 'heart-outline'}
            size={20}
            color={favoriteId ? theme.colors.danger : theme.colors.textPrimary}
          />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.carousel}
        onScroll={(event) => {
          const width = event.nativeEvent.layoutMeasurement.width || CAROUSEL_ITEM_WIDTH;
          const offsetX = event.nativeEvent.contentOffset.x;
          const nextIndex = Math.round(offsetX / width);
          setCurrentImageIndex(Math.max(0, Math.min(nextIndex, Math.max(property.images.length - 1, 0))));
        }}>
        {property.images.map((image) => (
          <Image
            key={image._id || image.url}
            source={resolvePropertyImageUrl(image) ? { uri: resolvePropertyImageUrl(image) } : undefined}
            style={styles.carouselImage}
            contentFit='cover'
          />
        ))}
      </ScrollView>
      {property.images.length > 1 ? (
        <View style={styles.carouselIndicatorWrap}>
          <View style={styles.carouselDots}>
            {property.images.map((image, index) => (
              <View
                key={`${image._id || image.url}-${index}`}
                style={[
                  styles.carouselDot,
                  index === currentImageIndex && styles.carouselDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{property.title}</Text>
          <StatusBadge status={property.status} />
        </View>
        <Text style={styles.price}>{formatLkr(property.price)}</Text>

        <View style={styles.locationRow}>
          <Ionicons name='location-outline' size={14} color={theme.colors.textMuted} />
          <Text style={styles.sub}>{property.city}</Text>
          {property.district ? <Text style={styles.sub}>, {property.district}</Text> : null}
        </View>

        <View style={styles.detailsRow}>
          {isResidential && property.bedrooms != null && (
            <View style={styles.detailChip}>
              <Ionicons name='bed-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.bedrooms} Beds</Text>
            </View>
          )}
          {(isResidential || isCommercial) && property.bathrooms != null && (
            <View style={styles.detailChip}>
              <Ionicons name='water-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.bathrooms} Baths</Text>
            </View>
          )}
          {!isLand && property.parkingSpaces != null && property.parkingSpaces > 0 && (
            <View style={styles.detailChip}>
              <Ionicons name='car-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.parkingSpaces} Parking</Text>
            </View>
          )}
          {isLand && property.landSize != null && (
            <View style={styles.detailChip}>
              <Ionicons name='map-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>Land: {property.landSize}</Text>
            </View>
          )}
          {!isLand && property.floorArea != null && (
            <View style={styles.detailChip}>
              <Ionicons name='resize-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>Floor: {property.floorArea}</Text>
            </View>
          )}
          {property.distanceFromCityCenterKm != null && (
            <View style={styles.detailChip}>
              <Ionicons name='navigate-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.distanceFromCityCenterKm} km to city</Text>
            </View>
          )}
          <View style={styles.detailChip}>
            <Ionicons name='pricetag-outline' size={14} color={theme.colors.primary} />
            <Text style={styles.detailText}>{property.listingType.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.description}>{property.description}</Text>
        <Text style={styles.meta}>Updated: {formatDate(property.updatedAt)}</Text>
      </View>

      {canManage ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text style={styles.statusHint}>Tap a status to update this listing.</Text>
            <View style={styles.statusPillRow}>
              {statusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  disabled={statusUpdating || option.value === property.status}
                  onPress={() => onChangeStatus(option.value)}
                  style={({ pressed }) => [
                    styles.statusPill,
                    option.value === property.status && styles.statusPillActive,
                    pressed && option.value !== property.status && !statusUpdating && styles.statusPillPressed,
                    statusUpdating && styles.statusPillDisabled,
                  ]}>
                  <Ionicons
                    name={STATUS_ICON[option.value]}
                    size={14}
                    color={option.value === property.status ? '#fff' : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      option.value === property.status && styles.statusPillTextActive,
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.actionRow}>
            <AppButton
              label='Edit'
              icon='create-outline'
              onPress={() => router.push(`/properties/${property._id}/edit`)}
              style={styles.actionBtn}
            />
            <AppButton
              label='Delete'
              icon='trash-outline'
              variant='danger'
              onPress={() => setShowDelete(true)}
              style={styles.actionBtn}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.actionRow}>
            <AppButton
              label='Book Appointment'
              icon='calendar-outline'
              onPress={() =>
                isSignedIn ? router.push(`/properties/${property._id}/book-appointment`) : router.push('/(auth)/sign-in')
              }
              style={styles.actionBtn}
            />
            <AppButton
              label='Send Inquiry'
              icon='chatbox-outline'
              variant='secondary'
              onPress={() =>
                isSignedIn ? router.push(`/properties/${property._id}/send-inquiry`) : router.push('/(auth)/sign-in')
              }
              style={styles.actionBtn}
            />
          </View>
        </>
      )}

      {property.listingType === 'rent' ? (
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
            <Text style={styles.reviewSummary}>
              {reviewCount > 0 ? `${averageRating.toFixed(1)}★ (${reviewCount})` : 'No reviews yet'}
            </Text>
          </View>

          {reviewsLoading ? <Text style={styles.meta}>Loading reviews...</Text> : null}

          {!reviewsLoading && reviews.length > 0 ? (
            <View style={styles.reviewList}>
              {reviews.slice(0, 6).map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.reviewAuthor}>
                      {review.userId === userId ? 'You' : review.userName || `User ${review.userId.slice(-6)}`}
                    </Text>
                    <Text style={styles.reviewRating}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                  </View>
                  {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                  <Text style={styles.meta}>Posted {formatDate(review.updatedAt || review.createdAt)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {canReview ? (
            <View style={styles.reviewForm}>
              <Text style={styles.fieldLabel}>{myReview ? 'Update your review' : 'Write a review'}</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setReviewRating(star)} style={styles.starBtn}>
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={22}
                      color={star <= reviewRating ? '#F59E0B' : theme.colors.textMuted}
                    />
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={[styles.input, styles.multiInput]}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                placeholder='Share your renting experience for this property'
                placeholderTextColor={theme.colors.textMuted}
              />

              <AppButton
                label={myReview ? 'Update Review' : 'Post Review'}
                icon='chatbox-ellipses-outline'
                loading={reviewSubmitting}
                onPress={saveReview}
              />
              {myReview ? (
                <AppButton
                  label='Delete My Review'
                  icon='trash-outline'
                  variant='secondary'
                  loading={reviewSubmitting}
                  onPress={deleteMyReview}
                />
              ) : null}
            </View>
          ) : (
            <Text style={styles.meta}>
              {isSignedIn
                ? 'Only non-owner users can review rent properties.'
                : 'Sign in to post your review for this rent property.'}
            </Text>
          )}
        </View>
      ) : null}

      <ConfirmModal
        visible={showDelete}
        title='Delete Property'
        description='This will permanently delete the property listing.'
        confirmLabel='Delete permanently'
        loading={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={onDelete}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
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
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  favoriteBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBtnPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  favoriteBtnDisabled: {
    opacity: 0.65,
  },
  carousel: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  carouselImage: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 220,
    backgroundColor: '#E2E8F0',
    borderRadius: theme.radius.lg,
  },
  carouselIndicatorWrap: {
    alignItems: 'center',
    gap: 4,
    marginTop: -4,
    marginBottom: theme.spacing.sm,
  },
  carouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: theme.radius.full,
    backgroundColor: '#CBD5E1',
  },
  carouselDotActive: {
    width: 18,
    backgroundColor: theme.colors.primary,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: 6,
    ...theme.shadow.soft,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  price: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sub: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 4,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
  },
  detailText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  statusHint: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statusPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusPillPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  statusPillDisabled: {
    opacity: 0.65,
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
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  reviewSummary: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
    fontSize: 13,
  },
  reviewList: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  reviewCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    gap: 4,
  },
  reviewAuthor: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  reviewRating: {
    ...theme.typography.caption,
    color: '#F59E0B',
    letterSpacing: 1,
  },
  reviewComment: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  reviewForm: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textSecondary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBtn: {
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
  },
  multiInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
});
