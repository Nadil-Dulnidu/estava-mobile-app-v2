import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ErrorState, LoadingState } from "@/src/components/common/StateViews";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { useAppSession } from "@/src/context/AppSessionContext";
import { propertyApi } from "@/src/services/api/property.api";
import { theme } from "@/src/theme";
import { Property } from "@/src/types/property";
import { formatLkr, getCoverImage } from "@/src/utils/format";

// ─── Category filter pill ─────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "All", value: "", icon: "grid-outline" },
  { label: "For Sale", value: "sale", icon: "pricetag-outline" },
  { label: "For Rent", value: "rent", icon: "key-outline" },
  { label: "Houses", value: "house", icon: "home-outline" },
  { label: "Apartments", value: "apartment", icon: "business-outline" },
  { label: "Land", value: "land", icon: "map-outline" },
] as const;

// ─── Featured card (horizontal scroll) ───────────────────────────────────────
const FeaturedCard = ({ property, onPress }: { property: Property; onPress: () => void }) => {
  const coverUrl = getCoverImage(property);
  return (
    <Pressable style={styles.featuredCard} onPress={onPress}>
      <Image source={{ uri: coverUrl }} style={styles.featuredImage} contentFit="cover" transition={300} />
      <View style={styles.featuredOverlay}>
        <View style={styles.featuredTypePill}>
          <Text style={styles.featuredTypeText}>{property.listingType.toUpperCase()}</Text>
        </View>
        <Text style={styles.featuredPrice}>{formatLkr(property.price)}</Text>
        <Text style={styles.featuredTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
          <Text style={styles.featuredCity}>{property.city}</Text>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Compact property row ─────────────────────────────────────────────────────
const PropertyRow = ({ property, onPress }: { property: Property; onPress: () => void }) => {
  const coverUrl = getCoverImage(property);
  return (
    <Pressable style={styles.rowCard} onPress={onPress}>
      <Image source={{ uri: coverUrl }} style={styles.rowImage} contentFit="cover" transition={200} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {property.title}
        </Text>
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={11} color={theme.colors.textMuted} />
          <Text style={styles.rowCity}>{property.city}</Text>
        </View>
        <Text style={styles.rowPrice}>{formatLkr(property.price)}</Text>
        <View style={styles.rowChips}>
          {property.bedrooms != null && (
            <View style={styles.chip}>
              <Ionicons name="bed-outline" size={10} color={theme.colors.primary} />
              <Text style={styles.chipText}>{property.bedrooms}</Text>
            </View>
          )}
          {property.bathrooms != null && (
            <View style={styles.chip}>
              <Ionicons name="water-outline" size={10} color={theme.colors.primary} />
              <Text style={styles.chipText}>{property.bathrooms}</Text>
            </View>
          )}
          <View style={[styles.chip, styles.typeChip]}>
            <Text style={styles.typeChipText}>{property.propertyType}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </Pressable>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export const HomeScreen = () => {
  const { isSignedIn, user } = useAppSession();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await propertyApi.getPublicProperties({
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setProperties(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const featured = useMemo(() => properties.slice(0, 5), [properties]);

  const filtered = useMemo(() => {
    if (!activeCategory) return properties;
    return properties.filter((p) => p.listingType === activeCategory || p.propertyType === activeCategory);
  }, [properties, activeCategory]);

  // derive stats
  const statsForSale = properties.filter((p) => p.listingType === "sale").length;
  const statsForRent = properties.filter((p) => p.listingType === "rent").length;
  const statsAvailable = properties.filter((p) => p.status === "available").length;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.firstName ?? (isSignedIn ? "there" : null);

  if (loading)
    return (
      <ScreenWrapper scroll={false}>
        <LoadingState message="Loading market overview..." />
      </ScreenWrapper>
    );
  if (error)
    return (
      <ScreenWrapper scroll={false}>
        <ErrorState message={error} onRetry={() => load()} />
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={theme.colors.primary} />}
        ListHeaderComponent={
          <>
            {/* ── App Header ── */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greetingText}>
                  {greeting}
                  {firstName ? `, ${firstName}` : ""} 👋
                </Text>
                <Text style={styles.brandText}>Estava</Text>
              </View>
              <Pressable style={styles.exploreBtn} onPress={() => router.push(isSignedIn ? "/(user)/explore" : "/(public)/listings")}>
                <Ionicons name="search-outline" size={18} color={theme.colors.primary} />
              </Pressable>
            </View>

            {/* ── Hero banner ── */}
            <View style={styles.heroBanner}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Find Your Dream{"\n"}Property in Sri Lanka</Text>
                <Text style={styles.heroSub}>Trusted listings across all 25 districts</Text>
                <Pressable style={styles.heroBtn} onPress={() => router.push(isSignedIn ? "/(user)/explore" : "/(public)/listings")}>
                  <Text style={styles.heroBtnText}>Browse Listings</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </Pressable>
              </View>
              <View style={styles.heroIconBlock}>
                <View style={styles.heroIconCircle}>
                  <Ionicons name="business" size={36} color={theme.colors.primary} />
                </View>
              </View>
            </View>

            {/* ── Market Stats ── */}
            <Text style={styles.sectionLabel}>Market Overview</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="home" size={20} color="#fff" />
                <Text style={styles.statNum}>{properties.length}</Text>
                <Text style={styles.statLbl}>Total Listings</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#1565C0" }]}>
                <Ionicons name="pricetag" size={20} color="#fff" />
                <Text style={styles.statNum}>{statsForSale}</Text>
                <Text style={styles.statLbl}>For Sale</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#6A1B9A" }]}>
                <Ionicons name="key" size={20} color="#fff" />
                <Text style={styles.statNum}>{statsForRent}</Text>
                <Text style={styles.statLbl}>For Rent</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.colors.success }]}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.statNum}>{statsAvailable}</Text>
                <Text style={styles.statLbl}>Available</Text>
              </View>
            </View>

            <View style={styles.quickRow}>
              <Pressable style={styles.quickCard} onPress={() => router.push(isSignedIn ? "/properties/add" : "/(auth)/sign-in")}>
                <View style={[styles.quickIcon, { backgroundColor: "#EDE7F6" }]}>
                  <Ionicons name="add-circle-outline" size={22} color="#6A1B9A" />
                </View>
                <Text style={styles.quickLabel}>Post Property</Text>
              </Pressable>
              <Pressable style={styles.quickCard} onPress={() => router.push(isSignedIn ? "/(user)/favorites" : "/(auth)/sign-in")}>
                <View style={[styles.quickIcon, { backgroundColor: "#FCE4EC" }]}>
                  <Ionicons name="heart-outline" size={22} color="#C62828" />
                </View>
                <Text style={styles.quickLabel}>Saved Properties</Text>
              </Pressable>
            </View>

            {/* ── Featured horizontal scroll ── */}
            {featured.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>Featured</Text>
                  <Pressable onPress={() => router.push(isSignedIn ? "/(user)/explore" : "/(public)/listings")}>
                    <Text style={styles.seeAll}>See all →</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
                  {featured.map((p) => (
                    <FeaturedCard key={p._id} property={p} onPress={() => router.push(`/properties/${p._id}`)} />
                  ))}
                </ScrollView>
              </>
            )}

            {/* ── Category pills ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable key={cat.value} style={[styles.catPill, activeCategory === cat.value && styles.catPillActive]} onPress={() => setActiveCategory(cat.value)}>
                  <Ionicons name={cat.icon as any} size={13} color={activeCategory === cat.value ? "#fff" : theme.colors.primary} />
                  <Text style={[styles.catText, activeCategory === cat.value && styles.catTextActive]}>{cat.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>{activeCategory ? `${filtered.length} results` : "Latest Listings"}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => <PropertyRow property={item} onPress={() => router.push(`/properties/${item._id}`)} />}
        contentContainerStyle={styles.listContent}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingTop: 4,
  },
  greetingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  brandText: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
    lineHeight: 26,
  },
  exploreBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.soft,
  },
  heroBanner: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentDark,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  heroContent: {
    flex: 1,
    gap: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
    lineHeight: 26,
  },
  heroSub: {
    ...theme.typography.body,
    color: "rgba(255,255,255,0.7)",
  },
  heroBtn: {
    marginTop: 4,
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
  },
  heroBtnText: {
    ...theme.typography.bodyStrong,
    color: "#fff",
  },
  heroIconBlock: {
    marginLeft: theme.spacing.md,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionLabel: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  seeAll: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flexBasis: "48%",
    flexGrow: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    gap: 4,
    ...theme.shadow.soft,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
    lineHeight: 26,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  quickRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 100,
    justifyContent: "center",
    ...theme.shadow.soft,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  featuredScroll: {
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featuredCard: {
    width: 240,
    height: 180,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    ...theme.shadow.card,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(22,50,74,0.72)",
    padding: theme.spacing.sm,
    gap: 2,
  },
  featuredTypePill: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    marginBottom: 2,
  },
  featuredTypeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
    letterSpacing: 0.5,
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Poppins-Regular",
    color: "#fff",
  },
  featuredTitle: {
    ...theme.typography.bodyStrong,
    color: "rgba(255,255,255,0.9)",
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  featuredCity: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Poppins-Regular",
  },
  categoryScroll: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    minHeight: 38,
  },
  catPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    color: theme.colors.primary,
  },
  catTextActive: {
    color: "#fff",
  },
  rowCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    alignItems: "center",
    gap: theme.spacing.sm,
    ...theme.shadow.soft,
  },
  rowImage: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.chipBg,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rowCity: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  rowPrice: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
    fontSize: 14,
  },
  rowChips: {
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
  },
  typeChip: {
    backgroundColor: "#EDE7F6",
  },
  typeChipText: {
    fontSize: 10,
    color: "#6A1B9A",
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
    textTransform: "capitalize",
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
