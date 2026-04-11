import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsive } from "@/src/hooks/useResponsive";
import { theme } from "@/src/theme";

interface ScreenWrapperProps {
  children: ReactNode;
  scroll?: boolean;
}

export const ScreenWrapper = ({ children, scroll = true }: ScreenWrapperProps) => {
  const { contentMaxWidth, isTablet, isPhoneSm } = useResponsive();

  const hPad = isTablet ? theme.spacing.xl : isPhoneSm ? theme.spacing.sm : theme.spacing.lg;

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.flex}>
          <View style={[styles.innerFlex, { paddingHorizontal: hPad, paddingTop: theme.spacing.md }]}>
            <View style={[styles.maxWidth, { maxWidth: contentMaxWidth }]}>{children}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={88} style={styles.flex}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: hPad }]} keyboardShouldPersistTaps="handled">
          <View style={[styles.maxWidth, { maxWidth: contentMaxWidth }]}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
  },
  flex: {
    flex: 1,
    width: "100%",
  },
  innerFlex: {
    flex: 1,
    alignItems: "center",
  },
  maxWidth: {
    width: "100%",
    flex: 1,
  },
  scroll: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    alignItems: "center",
  },
});
