import { Ionicons } from "@expo/vector-icons";
import { useOAuth, useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = fetchStatus === "fetching";

  const onSignUp = async () => {
    setFormError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First name and last name are required.");
      return;
    }
    if (!emailAddress.trim() || !password.trim()) {
      setFormError("Email and password are required.");
      return;
    }

    const { error } = await signUp.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      setFormError(error.longMessage || error.message || "Unable to create account. Please check your details.");
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(sendError.longMessage || sendError.message || "Failed to send verification code.");
      return;
    }

    setAwaitingVerification(true);
  };

  const onVerify = async () => {
    setFormError(null);

    if (!code.trim()) {
      setFormError("Verification code is required.");
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (error) {
      setFormError(error.longMessage || error.message || "Invalid verification code.");
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl("/") as any);
        },
      });
    } else {
      setFormError("Verification incomplete. Please try again.");
      console.error("Sign-up not complete:", signUp.status);
    }
  };

  const onGoogleSignUp = async () => {
    setFormError(null);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Google sign-up failed.");
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
              <Ionicons name="person-add" size={26} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Estava and start your property journey</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {!awaitingVerification ? (
              <>
                {/* Name row */}
                <View style={styles.nameRow}>
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <Text style={styles.fieldLabel}>First Name</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder="John"
                        placeholderTextColor={theme.colors.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                    {errors?.fields?.firstName && (
                      <Text style={styles.fieldError}>{errors.fields.firstName.message}</Text>
                    )}
                  </View>
                  <View style={[styles.fieldGroup, styles.halfField]}>
                    <Text style={styles.fieldLabel}>Last Name</Text>
                    <View style={styles.inputWrap}>
                      <TextInput
                        style={styles.input}
                        placeholder="Doe"
                        placeholderTextColor={theme.colors.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                    {errors?.fields?.lastName && (
                      <Text style={styles.fieldError}>{errors.fields.lastName.message}</Text>
                    )}
                  </View>
                </View>

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
                      placeholder="Create a strong password"
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

                {/* Create button */}
                <Pressable
                  disabled={isLoading}
                  onPress={onSignUp}
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
                      <Ionicons name="person-add-outline" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>Create Account</Text>
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
                  onPress={onGoogleSignUp}
                  style={({ pressed }) => [styles.googleBtn, pressed && styles.btnPressed]}
                >
                  <Ionicons name="logo-google" size={18} color={theme.colors.textPrimary} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </Pressable>

                {/* Link to sign in */}
                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>Already have an account?</Text>
                  <Link href="/(auth)/sign-in" style={styles.linkAction}>
                    Sign in
                  </Link>
                </View>

                {/* Required for Clerk's bot protection */}
                <View nativeID="clerk-captcha" />
              </>
            ) : (
              <>
                <View style={styles.verifyHeader}>
                  <View style={[styles.logoCircle, { width: 56, height: 56 }]}>
                    <Ionicons name="mail-open-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.verifyTitle}>Check Your Email</Text>
                  <Text style={styles.subtitle}>
                    We sent a verification code to {emailAddress}
                  </Text>
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
                  onPress={onVerify}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    isLoading && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify Email</Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={async () => {
                    await signUp.verifications.sendEmailCode();
                  }}
                  style={styles.secondaryBtn}
                >
                  <Ionicons name="refresh-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.secondaryBtnText}>Resend code</Text>
                </Pressable>
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
  nameRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  halfField: {
    flex: 1,
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
  verifyHeader: {
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  verifyTitle: {
    ...theme.typography.h3,
    color: theme.colors.accentDark,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
