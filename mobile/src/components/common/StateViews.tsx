import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/src/components/common/AppButton";
import { theme } from "@/src/theme";

interface StateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const LoadingState = ({ message = "Loading..." }: StateProps) => (
  <View style={styles.center}>
    <View style={styles.iconCircle}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
    <Text style={styles.title}>{message}</Text>
    <Text style={styles.message}>Hang tight, we&apos;re fetching your data</Text>
  </View>
);

export const EmptyState = ({ title = "Nothing here yet", message = "Try creating one or adjusting your filters." }: StateProps) => (
  <View style={styles.center}>
    <View style={[styles.iconCircle, { backgroundColor: "#F0F4F8" }]}>
      <Ionicons name="file-tray-outline" size={32} color={theme.colors.textMuted} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

export const ErrorState = ({ title = "Oops! Something went wrong", message, onRetry }: StateProps) => {
  // Detect common errors and show user-friendly messages
  const friendlyMessage = message
    ? message.toLowerCase().includes("network")
      ? "It looks like you're not connected to the internet. Please check your Wi-Fi or mobile data and try again."
      : message.toLowerCase().includes("fetch") || message.toLowerCase().includes("failed to load")
        ? "We couldn't reach our servers right now. This could be a temporary issue \u2014 please try again in a moment."
        : message.toLowerCase().includes("timeout")
          ? "The request took too long. Please check your connection and try again."
          : message
    : "We ran into an unexpected issue. Please try again \u2014 if it persists, the server may be temporarily unavailable.";

  return (
    <View style={styles.center}>
      <View style={[styles.iconCircle, { backgroundColor: "#FFF5F5" }]}>
        <Ionicons name="cloud-offline-outline" size={36} color={theme.colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{friendlyMessage}</Text>

      {/* Helpful tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Things you can try:</Text>
        <View style={styles.tipRow}>
          <Ionicons name="wifi-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.tipText}>Check your internet connection</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="refresh-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.tipText}>Refresh and try again</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.tipText}>Wait a moment and retry</Text>
        </View>
      </View>

      {onRetry ? <AppButton label="Try Again" icon="refresh-outline" onPress={onRetry} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
    textAlign: "center",
  },
  message: {
    ...theme.typography.body,
    textAlign: "center",
    color: theme.colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    width: "100%",
    marginTop: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  tipsTitle: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  tipText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
