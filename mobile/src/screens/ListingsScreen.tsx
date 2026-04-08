import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/src/components/common/AppHeader";
import { ErrorState, LoadingState, EmptyState } from "@/src/components/common/StateViews";
import { SearchBar } from "@/src/components/common/SearchBar";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { AppButton } from "@/src/components/common/AppButton";
import { OptionSelect } from "@/src/components/property/OptionSelect";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { SORT_OPTIONS, STATUS_OPTIONS } from "@/src/constants/property";
import { propertyApi } from "@/src/services/api/property.api";
import { theme } from "@/src/theme";
import { Property, PropertyStatus } from "@/src/types/property";

export const ListingsScreen = () => {
  const router = useRouter();

  const [search, setSearch] = useState("");
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
        const payload = {
          search,
          status,
          sortBy: sort.sortBy,
          sortOrder: sort.sortOrder,
          page: 1,
          limit: 20,
        };
        const response = await propertyApi.getPublicProperties(payload);

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

  const filtered = useMemo(() => items, [items]);

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <AppHeader title="Listings" subtitle="Search, filter and compare properties" />

        <SearchBar value={search} onChangeText={setSearch} />
        <View style={styles.rowGap}>
          <AppButton label="Apply Search" onPress={() => fetchListings()} variant="secondary" />
        </View>

        <OptionSelect label="Status" value={status} options={[{ label: "All", value: "" }, ...STATUS_OPTIONS]} onChange={(value) => setStatus(value as PropertyStatus | "")} />

        <Text style={styles.sortLabel}>Sort</Text>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option, idx) => (
            <AppButton key={option.label} label={option.label} variant={idx === sortIndex ? "primary" : "secondary"} onPress={() => setSortIndex(idx)} style={styles.sortBtn} />
          ))}
        </View>

        {loading ? <LoadingState message="Loading listings..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => fetchListings()} /> : null}

        {!loading && !error ? (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchListings(true)} />}
            renderItem={({ item }) => <PropertyCard property={item} onPress={() => router.push(`/properties/${item._id}`)} />}
            ListEmptyComponent={<EmptyState title="No listings found" message="Try adjusting filters." />}
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
  rowGap: {
    marginBottom: theme.spacing.xs,
  },
  sortLabel: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  sortRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  sortBtn: {
    flex: 1,
    minWidth: 130,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
