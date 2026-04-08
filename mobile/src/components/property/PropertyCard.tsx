import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from '@/src/components/property/StatusBadge';
import { theme } from '@/src/theme';
import { Property } from '@/src/types/property';
import { compactText, formatLkr, getCoverImage } from '@/src/utils/format';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PropertyCard = ({ property, onPress, onEdit, onDelete }: PropertyCardProps) => (
  <Pressable onPress={onPress} style={styles.card}>
    <Image
      source={getCoverImage(property) ? { uri: getCoverImage(property) } : undefined}
      style={styles.image}
      contentFit='cover'
    />
    <View style={styles.body}>
      <View style={styles.rowBetween}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{compactText(property.title, 48)}</Text>
          <Text style={styles.sub}>{property.city}</Text>
        </View>
        <StatusBadge status={property.status} />
      </View>

      <Text style={styles.price}>{formatLkr(property.price)}</Text>
      <Text style={styles.meta}>
        {property.listingType.toUpperCase()} • {property.propertyType} • {property.bedrooms ?? '-'} bed
      </Text>

      {(onEdit || onDelete) ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} style={styles.iconBtn}>
              <Ionicons name='create-outline' size={18} color={theme.colors.textPrimary} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable onPress={onDelete} style={styles.iconBtn}>
              <Ionicons name='trash-outline' size={18} color={theme.colors.danger} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  image: {
    height: 170,
    width: '100%',
    backgroundColor: '#E2E8F0',
  },
  body: {
    padding: theme.spacing.md,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  sub: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  price: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
