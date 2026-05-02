import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { AppButton } from '@/src/components/common/AppButton';
import { AppInput } from '@/src/components/common/AppInput';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { useAppSession } from '@/src/context/AppSessionContext';
import { FAVORITE_NOTE_MAX_LENGTH, favoriteApi, Favorite } from '@/src/services/api/favorite.api';
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
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingFavoriteId, setEditingFavoriteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const getTokenRef = useRef(getToken);

  // Safe ref update - never put getToken in effect deps
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

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (favoriteId: string) => {
    try {
      await favoriteApi.removeFavorite(favoriteId, getTokenRef.current);
      setItems((prev) => prev.filter((item) => item._id !== favoriteId));
    } catch (removeError) {
      Alert.alert('Failed', removeError instanceof Error ? removeError.message : 'Unable to remove favorite');
    }
  };

  const openNoteEditor = (item: Favorite) => {
    setEditingFavoriteId(item._id);
    setNoteDraft(item.note || '');
    setNoteModalVisible(true);
  };

  const closeNoteEditor = () => {
    if (savingNote) return;
    setNoteModalVisible(false);
    setEditingFavoriteId(null);
    setNoteDraft('');
  };

  const saveNote = async () => {
    if (!editingFavoriteId) return;

    const trimmedNote = noteDraft.trim();
    const note = trimmedNote.length > 0 ? trimmedNote : null;

    setSavingNote(true);
    try {
      const response = await favoriteApi.updateFavoriteNote(editingFavoriteId, note, getTokenRef.current);
      setItems((prev) =>
        prev.map((item) => (item._id === editingFavoriteId ? { ...item, note: response.data.note ?? null } : item))
      );
      setNoteModalVisible(false);
      setEditingFavoriteId(null);
      setNoteDraft('');
    } catch (saveError) {
      Alert.alert('Failed', saveError instanceof Error ? saveError.message : 'Unable to update note');
    } finally {
      setSavingNote(false);
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
          <AppButton label='Sign In' icon='log-in-outline' onPress={() => router.push('/(auth)/sign-in')} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Properties</Text>
          <Text style={styles.headerSub}>
            {items.length > 0
              ? `${items.length} saved propert${items.length > 1 ? 'ies' : 'y'}`
              : 'Your curated shortlist'}
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
            const property = typeof item.propertyId === 'string' ? null : (item.propertyId as unknown as Property);
            if (!property?._id) return null;
            const coverUrl = getCoverImage(property);
            const noteText = item.note?.trim() || '';

            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/properties/${property._id}`)}>
                <Image source={coverUrl ? { uri: coverUrl } : undefined} style={styles.cardImage} contentFit='cover' transition={200} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {property.title}
                  </Text>
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
                  {noteText ? (
                    <View style={styles.noteRow}>
                      <Ionicons name='document-text-outline' size={12} color={theme.colors.textMuted} />
                      <Text style={styles.noteText} numberOfLines={3}>
                        {noteText}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable style={styles.noteButton} onPress={() => openNoteEditor(item)} hitSlop={8}>
                    <Ionicons name='create-outline' size={14} color={theme.colors.primary} />
                    <Text style={styles.noteButtonText}>{noteText ? 'Edit note' : 'Add note'}</Text>
                  </Pressable>
                </View>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() =>
                    Alert.alert('Remove Favorite', 'Remove this property from your saved list?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => void remove(item._id) },
                    ])
                  }
                  hitSlop={8}>
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

      <Modal visible={noteModalVisible} transparent animationType='fade' onRequestClose={closeNoteEditor}>
        <Pressable style={styles.modalOverlay} onPress={closeNoteEditor}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            <Text style={styles.modalTitle}>Personal note</Text>
            <Text style={styles.modalDescription}>Add context for why you saved this property.</Text>
            <AppInput
              label='Note'
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder='Example: Near office, revisit on weekend'
              multiline
              numberOfLines={4}
              maxLength={FAVORITE_NOTE_MAX_LENGTH}
              style={styles.noteInput}
              textAlignVertical='top'
            />
            <Text style={styles.noteCounter}>
              {noteDraft.length}/{FAVORITE_NOTE_MAX_LENGTH}
            </Text>
            <View style={styles.modalActions}>
              <AppButton label='Cancel' variant='secondary' onPress={closeNoteEditor} style={styles.modalAction} />
              <AppButton
                label='Save note'
                onPress={() => void saveNote()}
                loading={savingNote}
                disabled={!editingFavoriteId}
                style={styles.modalAction}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  noteRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-start',
    marginTop: 2,
  },
  noteText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    marginTop: 2,
  },
  noteButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontFamily: 'Poppins-Regular',
  },
  removeBtn: {
    padding: 8,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  modalDescription: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  noteInput: {
    height: 110,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  noteCounter: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  modalAction: {
    flex: 1,
  },
});
