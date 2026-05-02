import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { appointmentApi } from '@/src/services/api/appointment.api';
import { propertyApi } from '@/src/services/api/property.api';
import { theme } from '@/src/theme';
import { Property } from '@/src/types/property';
import { formatLkr, resolvePropertyImageUrl } from '@/src/utils/format';

const toIsoDateTime = (date: string, time: string) => {
  const raw = `${date}T${time}:00`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
};

export const BookAppointmentScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('Property visit');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const loadProperty = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getPublicPropertyById(id);
      setProperty(response.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to load property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  const onSubmit = async () => {
    if (!id) return;

    if (!isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }

    if (!appointmentDate.trim() || !appointmentTime.trim()) {
      Alert.alert('Missing details', 'Please enter both appointment date and time.');
      return;
    }

    const appointmentDateTime = toIsoDateTime(appointmentDate.trim(), appointmentTime.trim());
    if (!appointmentDateTime) {
      Alert.alert('Invalid date', 'Use date as YYYY-MM-DD and time as HH:mm.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentApi.createAppointment(
        {
          propertyId: id,
          appointmentDateTime,
          visitPurpose: visitPurpose.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        getTokenRef.current
      );
      Alert.alert('Booked', 'Appointment created successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (submitError) {
      Alert.alert('Booking failed', submitError instanceof Error ? submitError.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>
        <LoadingState message='Preparing appointment form...' />
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
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>
        <ErrorState message={error || 'Unable to load property'} onRetry={loadProperty} />
      </ScreenWrapper>
    );
  }

  const previewImage = resolvePropertyImageUrl(property.images.find((image) => image.isCover) || property.images[0]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name='arrow-back' size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.propertyCard}>
        {previewImage ? <Image source={{ uri: previewImage }} style={styles.propertyImage} contentFit='cover' /> : null}
        <View style={styles.propertyContent}>
          <Text numberOfLines={1} style={styles.propertyTitle}>
            {property.title}
          </Text>
          <Text style={styles.propertyPrice}>{formatLkr(property.price)}</Text>
          <Text style={styles.propertyMeta}>
            {property.city}
            {property.district ? `, ${property.district}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Choose Visit Date & Time</Text>

        <Text style={styles.fieldLabel}>Date</Text>
        <TextInput
          style={styles.input}
          placeholder='YYYY-MM-DD'
          placeholderTextColor={theme.colors.textMuted}
          value={appointmentDate}
          onChangeText={setAppointmentDate}
          autoCapitalize='none'
        />

        <Text style={styles.fieldLabel}>Time</Text>
        <TextInput
          style={styles.input}
          placeholder='HH:mm'
          placeholderTextColor={theme.colors.textMuted}
          value={appointmentTime}
          onChangeText={setAppointmentTime}
          autoCapitalize='none'
        />

        <Text style={styles.fieldLabel}>Visit Purpose (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder='Property visit'
          placeholderTextColor={theme.colors.textMuted}
          value={visitPurpose}
          onChangeText={setVisitPurpose}
        />

        <Text style={styles.fieldLabel}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multiInput]}
          multiline
          placeholder='Any special request before your visit?'
          placeholderTextColor={theme.colors.textMuted}
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <View style={styles.footer}>
        <AppButton label='Confirm Booking' icon='checkmark-outline' onPress={onSubmit} loading={submitting} />
        <AppButton label='Cancel' variant='secondary' onPress={() => router.back()} />
      </View>
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
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    ...theme.shadow.soft,
  },
  propertyImage: {
    width: 88,
    height: 88,
    borderRadius: theme.radius.md,
    backgroundColor: '#E2E8F0',
  },
  propertyContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  propertyTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  propertyPrice: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
  propertyMeta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fieldLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    height: 50,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    fontSize: 14,
  },
  multiInput: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  footer: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});
