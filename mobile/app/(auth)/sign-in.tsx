import { Ionicons } from "@expo/vector-icons";
import { useOAuth, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [needsMfaCode, setNeedsMfaCode] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = fetchStatus === "fetching";

  const onSignIn = async () => {
    setFormError(null);

    if (!emailAddress.trim() || !password.trim()) {
      setFormError("Email and password are required.");
      return;
    }

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      setFormError(error.longMessage || error.message || "Invalid email or password.");
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl("/") as any);
        },
      });
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === "email_code");
      if (emailCodeFactor) {
        const { error: mfaError } = await signIn.mfa.sendEmailCode();
        if (!mfaError) {
          setNeedsMfaCode(true);
          return;
        }
      }
    }

    if (signIn.status === "needs_second_factor") {
      const { error: mfaError } = await signIn.mfa.sendEmailCode();
      if (!mfaError) {
        setNeedsMfaCode(true);
        return;
      }
    }
  };

  const onVerifyMfa = async () => {
    setFormError(null);

    if (!code.trim()) {
      setFormError("Verification code is required.");
      return;
    }

    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });

    if (error) {
      setFormError(error.longMessage || error.message || "Invalid code.");
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl("/") as any);
        },
      });
    }
  };

  const onGoogleSignIn = async () => {
    setFormError(null);

    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-in failed.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(public)");
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </Pressable>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="business" size={28} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue exploring curated listings</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {!needsMfaCode ? (
              <>
                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      placeholderTextColor={theme.colors.textMuted}
                      value={emailAddress}
                      onChangeText={setEmailAddress}
                    />
                  </View>
                  {errors?.fields?.emailAddress && (
                    <Text style={styles.fieldError}>{errors.fields.emailAddress.message}</Text>
                  )}
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      secureTextEntry={!showPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.colors.textMuted}
                      />
                    </Pressable>
                  </View>
                  {errors?.fields?.password && (
                    <Text style={styles.fieldError}>{errors.fields.password.message}</Text>
                  )}
                </View>

                {formError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                {/* Sign in button */}
                <Pressable
                  disabled={isLoading}
                  onPress={onSignIn}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    isLoading && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                    </>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google */}
                <Pressable
                  onPress={onGoogleSignIn}
                  style={({ pressed }) => [styles.googleBtn, pressed && styles.btnPressed]}
                >
                  <Ionicons name="logo-google" size={18} color={theme.colors.textPrimary} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </Pressable>

                {/* Link to sign up */}
                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>Don't have an account?</Text>
                  <Link href="/(auth)/sign-up" style={styles.linkAction}>
                    Sign up
                  </Link>
                </View>
              </>
            ) : (
              <>
                <View style={styles.mfaHeader}>
                  <View style={[styles.logoCircle, { width: 56, height: 56 }]}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.mfaTitle}>Verify Your Identity</Text>
                  <Text style={styles.subtitle}>Enter the verification code sent to your email.</Text>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Verification Code</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="keypad-outline" size={18} color={theme.colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholder="000000"
                      placeholderTextColor={theme.colors.textMuted}
                      value={code}
                      onChangeText={setCode}
                    />
                  </View>
                  {errors?.fields?.code && (
                    <Text style={styles.fieldError}>{errors.fields.code.message}</Text>
                  )}
                </View>

                {formError ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                ) : null}

                <Pressable
                  disabled={isLoading}
                  onPress={onVerifyMfa}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    isLoading && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify Code</Text>
                  )}
                </Pressable>

                <View style={styles.mfaActions}>
                  <Pressable
                    onPress={async () => {
                      await signIn.mfa.sendEmailCode();
                    }}
                    style={styles.secondaryBtn}
                  >
                    <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.secondaryBtnText}>Resend code</Text>
                  </Pressable>

                  <Pressable
                    onPress={async () => {
                      await signIn.reset();
                      setNeedsMfaCode(false);
                      setCode("");
                    }}
                    style={styles.secondaryBtn}
                  >
                    <Ionicons name="arrow-back-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.secondaryBtnText}>Back to sign in</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {/* Browse as guest */}
          <Pressable
            style={styles.guestLink}
            onPress={() => router.replace("/(public)")}
          >
            <Text style={styles.guestLinkText}>Continue as Guest</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadow.soft,
  },
  headerSection: {
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.accentDark,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    height: 50,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
    fontSize: 14,
    height: "100%",
  },
  fieldError: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.danger,
    flex: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    ...theme.shadow.soft,
  },
  primaryBtnText: {
    ...theme.typography.bodyStrong,
    color: "#fff",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.9,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleBtn: {
    height: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  googleBtnText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  linkRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  linkText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  linkAction: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
  mfaHeader: {
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  mfaTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  mfaActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: theme.spacing.xs,
  },
  secondaryBtnText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
  guestLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  guestLinkText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.primary,
  },
});
