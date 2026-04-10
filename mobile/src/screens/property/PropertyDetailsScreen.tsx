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
import { appointmentApi } from '@/src/services/api/appointment.api';
import { inquiryApi } from '@/src/services/api/inquiry.api';
import { useAppSession } from '@/src/context/AppSessionContext';
import { STATUS_OPTIONS } from '@/src/constants/property';
import { propertyApi } from '@/src/services/api/property.api';
import { theme } from '@/src/theme';
import { Property, PropertyStatus } from '@/src/types/property';
import { formatDate, formatLkr } from '@/src/utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const PropertyDetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const { isSignedIn, isAdmin } = useAppSession();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');

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
      const response = await propertyApi.updatePropertyStatus(id, status, getTokenRef.current);
      setProperty(response.data);
    } catch (e) {
      Alert.alert('Status update failed', e instanceof Error ? e.message : 'Please try again');
    }
  };

  const onSendInquiry = async () => {
    if (!id || !inquiryMessage.trim()) return;

    try {
      await inquiryApi.createInquiry(
        {
          propertyId: id,
          message: inquiryMessage.trim(),
          subject: `Inquiry for ${property?.title || 'property'}`,
        },
        getTokenRef.current
      );
      setInquiryMessage('');
      setShowInquiryForm(false);
      Alert.alert('Sent', 'Inquiry sent successfully.');
    } catch (error) {
      Alert.alert('Failed', error instanceof Error ? error.message : 'Unable to send inquiry');
    }
  };

  const onBookAppointment = async () => {
    if (!id || !appointmentDateTime.trim()) return;

    try {
      await appointmentApi.createAppointment(
        {
          propertyId: id,
          appointmentDateTime: appointmentDateTime.trim(),
          visitPurpose: 'Property visit',
        },
        getTokenRef.current
      );
      setAppointmentDateTime('');
      setShowAppointmentForm(false);
      Alert.alert('Booked', 'Appointment created successfully.');
    } catch (error) {
      Alert.alert('Failed', error instanceof Error ? error.message : 'Unable to create appointment');
    }
  };

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

  return (
    <ScreenWrapper>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Property Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carousel}>
        {property.images.map((image) => (
          <Image key={image._id || image.url} source={{ uri: image.url }} style={styles.carouselImage} />
        ))}
      </ScrollView>

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
          {property.bedrooms != null && (
            <View style={styles.detailChip}>
              <Ionicons name='bed-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.bedrooms} Beds</Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View style={styles.detailChip}>
              <Ionicons name='water-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.bathrooms} Baths</Text>
            </View>
          )}
          {property.parkingSpaces != null && (
            <View style={styles.detailChip}>
              <Ionicons name='car-outline' size={14} color={theme.colors.primary} />
              <Text style={styles.detailText}>{property.parkingSpaces} Parking</Text>
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
            <View style={styles.wrapRow}>
              {STATUS_OPTIONS.map((option) => (
                <AppButton
                  key={option.value}
                  label={option.label}
                  variant={option.value === property.status ? 'primary' : 'secondary'}
                  onPress={() => onChangeStatus(option.value)}
                  style={styles.statusBtn}
                />
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
              onPress={() => (isSignedIn ? setShowAppointmentForm((prev) => !prev) : router.push('/(auth)/sign-in'))}
              style={styles.actionBtn}
            />
            <AppButton
              label='Send Inquiry'
              icon='chatbox-outline'
              variant='secondary'
              onPress={() => (isSignedIn ? setShowInquiryForm((prev) => !prev) : router.push('/(auth)/sign-in'))}
              style={styles.actionBtn}
            />
          </View>

          {showAppointmentForm ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Book appointment</Text>
              <TextInput
                style={styles.input}
                placeholder='2026-12-30T14:30:00.000Z'
                placeholderTextColor={theme.colors.textMuted}
                value={appointmentDateTime}
                onChangeText={setAppointmentDateTime}
              />
              <AppButton label='Confirm Booking' icon='checkmark-outline' onPress={onBookAppointment} />
            </View>
          ) : null}

          {showInquiryForm ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Send inquiry</Text>
              <TextInput
                style={[styles.input, styles.multiInput]}
                multiline
                placeholder='Type your inquiry message'
                placeholderTextColor={theme.colors.textMuted}
                value={inquiryMessage}
                onChangeText={setInquiryMessage}
              />
              <AppButton label='Send Inquiry' icon='send-outline' onPress={onSendInquiry} />
            </View>
          ) : null}
        </>
      )}

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
  carousel: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  carouselImage: {
    width: SCREEN_WIDTH - 40,
    height: 220,
    backgroundColor: '#E2E8F0',
    marginRight: 8,
    borderRadius: theme.radius.lg,
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
  statusBtn: {
    minWidth: 120,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    height: 48,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  multiInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
});
