import { useOAuth, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ScreenWrapper } from "@/src/components/common/ScreenWrapper";
import { theme } from "@/src/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
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

    // If status is still not complete, check for MFA requirement
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl("/") as any);
        },
      });
      return;
    }

    // Check if needs_client_trust (MFA via email code)
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

    // needs_second_factor or other
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
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Estava.</Text>

        {!needsMfaCode ? (
          <>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={theme.colors.textMuted}
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
            {errors?.fields?.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}

            <TextInput style={styles.input} secureTextEntry placeholder="Password" placeholderTextColor={theme.colors.textMuted} value={password} onChangeText={setPassword} />
            {errors?.fields?.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable disabled={isLoading} onPress={onSignIn} style={({ pressed }) => [styles.button, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
            </Pressable>
            <Pressable onPress={onGoogleSignIn} style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}>
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Don&apos;t have an account?</Text>
              <Link href="/(auth)/sign-up" style={styles.linkAction}>
                Sign up
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Enter the verification code sent to your email.</Text>
            <TextInput style={styles.input} keyboardType="number-pad" placeholder="Verification code" placeholderTextColor={theme.colors.textMuted} value={code} onChangeText={setCode} />
            {errors?.fields?.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable disabled={isLoading} onPress={onVerifyMfa} style={({ pressed }) => [styles.button, isLoading && styles.buttonDisabled, pressed && styles.buttonPressed]}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify code</Text>}
            </Pressable>

            <Pressable
              onPress={async () => {
                await signIn.mfa.sendEmailCode();
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>Resend code</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await signIn.reset();
                setNeedsMfaCode(false);
                setCode("");
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>← Back to sign in</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    height: 48,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  error: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    marginTop: -2,
  },
  button: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  buttonText: {
    ...theme.typography.bodyStrong,
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  linkRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: theme.spacing.sm,
  },
  linkText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  linkAction: {
    ...theme.typography.bodyStrong,
    color: theme.colors.info,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  secondaryText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.info,
  },
  googleButton: {
    height: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  googleText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
});
