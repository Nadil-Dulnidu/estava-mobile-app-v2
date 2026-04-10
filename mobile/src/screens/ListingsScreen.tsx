import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/common/StateViews";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { SORT_OPTIONS, STATUS_OPTIONS } from "@/src/constants/property";
import { propertyApi } from "@/src/services/api/property.api";
import { theme } from "@/src/theme";
import { Property, PropertyStatus } from "@/src/types/property";
import { formatLkr, getCoverImage } from "@/src/utils/format";

const LISTING_TYPES = [
  { label: "All", value: "" },
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
];

const PROPERTY_TYPES = [
  { label: "All Types", value: "" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Land", value: "land" },
  { label: "Commercial", value: "commercial" },
];

const FilterPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
    <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
  </Pressable>
);

const PropertyListCard = ({ property, onPress }: { property: Property; onPress: () => void }) => {
  const coverUrl = getCoverImage(property);
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <Image source={{ uri: coverUrl }} style={styles.cardImage} contentFit="cover" transition={200} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.listingTypePill}>
            <Text style={styles.listingTypeText}>{property.listingType.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: property.status === "available" ? "#E8F5E9" : "#FFF8E1" }]}>
            <View style={[styles.statusDot, { backgroundColor: property.status === "available" ? theme.colors.success : theme.colors.warning }]} />
            <Text style={[styles.statusText, { color: property.status === "available" ? theme.colors.success : theme.colors.warning }]}>{property.status}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={theme.colors.textMuted} />
          <Text style={styles.cardCity}>{property.city}</Text>
          {property.district ? <Text style={styles.cardCity}>, {property.district}</Text> : null}
        </View>
        <Text style={styles.cardPrice}>{formatLkr(property.price)}</Text>
        <View style={styles.chipRow}>
          {property.bedrooms != null && (
            <View style={styles.chip}>
              <Ionicons name="bed-outline" size={10} color={theme.colors.primary} />
              <Text style={styles.chipText}>{property.bedrooms} Beds</Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View style={styles.chip}>
              <Ionicons name="water-outline" size={10} color={theme.colors.primary} />
              <Text style={styles.chipText}>{property.bathrooms} Baths</Text>
            </View>
          )}
          <View style={[styles.chip, { backgroundColor: "#EDE7F6" }]}>
            <Text style={[styles.chipText, { color: "#6A1B9A" }]}>{property.propertyType}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={{ alignSelf: "center" }} />
    </Pressable>
  );
};

export const ListingsScreen = () => {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [listingType, setListingType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [status, setStatus] = useState<PropertyStatus | "">("");
  const [sortIndex, setSortIndex] = useState(0);
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sort = SORT_OPTIONS[sortIndex];

  const fetchListings = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const response = await propertyApi.getPublicProperties({
          search,
          status,
          sortBy: sort.sortBy,
          sortOrder: sort.sortOrder,
          page: 1,
          limit: 30,
        });
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch listings");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, sort.sortBy, sort.sortOrder, status],
  );

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filtered = useMemo(() => {
    let result = items;
    if (listingType) result = result.filter((p) => p.listingType === listingType);
    if (propertyType) result = result.filter((p) => p.propertyType === propertyType);
    return result;
  }, [items, listingType, propertyType]);

  return (
    <ScreenWrapper scroll={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSub}>{!loading ? `${filtered.length} properties found` : "Searching listings..."}</Text>
        </View>
      </View>

      {/* Search box */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city, title or address..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => fetchListings()}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {LISTING_TYPES.map((t) => (
            <FilterPill key={t.value} label={t.label} active={listingType === t.value} onPress={() => setListingType(t.value)} />
          ))}
          <View style={styles.pillDivider} />
          {PROPERTY_TYPES.map((t) => (
            <FilterPill key={t.value} label={t.label} active={propertyType === t.value} onPress={() => setPropertyType(t.value)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {SORT_OPTIONS.map((option, idx) => (
            <FilterPill key={option.label} label={option.label} active={idx === sortIndex} onPress={() => setSortIndex(idx)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {[{ label: "Any Status", value: "" }, ...STATUS_OPTIONS].map((opt) => (
            <FilterPill key={opt.value} label={opt.label} active={status === opt.value} onPress={() => setStatus(opt.value as PropertyStatus | "")} />
          ))}
        </ScrollView>
      </View>

      {loading ? <LoadingState message="Loading listings..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => fetchListings()} /> : null}

      {!loading && !error ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchListings(true)} tintColor={theme.colors.primary} />}
          renderItem={({ item }) => <PropertyListCard property={item} onPress={() => router.push(`/properties/${item._id}`)} />}
          ListEmptyComponent={<EmptyState title="No listings found" message="Try adjusting your search or filters." />}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing.md,
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    height: 50,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    height: "100%",
  },
  filtersWrap: {
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  pillRow: {
    gap: 6,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: theme.colors.textSecondary,
  },
  pillTextActive: {
    color: "#fff",
  },
  pillDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    marginHorizontal: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
    ...theme.shadow.soft,
  },
  cardPressed: {
    backgroundColor: theme.colors.chipBg,
  },
  cardImage: {
    width: 100,
    height: "100%",
    minHeight: 110,
    backgroundColor: theme.colors.chipBg,
  },
  cardBody: {
    flex: 1,
    padding: theme.spacing.sm,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  listingTypePill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  listingTypeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    textTransform: "capitalize",
  },
  cardTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
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
  chipRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.chipBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  chipText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    textTransform: "capitalize",
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
