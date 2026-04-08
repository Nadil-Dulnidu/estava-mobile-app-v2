import { useOAuth, useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { theme } from '@/src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isLoading = fetchStatus === 'fetching';

  const onSignUp = async () => {
    setFormError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }
    if (!emailAddress.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return;
    }

    const { error } = await signUp.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      setFormError(
        error.longMessage || error.message || 'Unable to create account. Please check your details.',
      );
      return;
    }

    // Send email verification code
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(sendError.longMessage || sendError.message || 'Failed to send verification code.');
      return;
    }

    setAwaitingVerification(true);
  };

  const onVerify = async () => {
    setFormError(null);

    if (!code.trim()) {
      setFormError('Verification code is required.');
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });

    if (error) {
      setFormError(error.longMessage || error.message || 'Invalid verification code.');
      return;
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          router.replace(decorateUrl('/') as any);
        },
      });
    } else {
      setFormError('Verification incomplete. Please try again.');
      console.error('Sign-up not complete:', signUp.status);
    }
  };

  const onGoogleSignUp = async () => {
    setFormError(null);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-up failed.');
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Estava and start listing properties.</Text>

        {!awaitingVerification ? (
          <>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder='First name'
                placeholderTextColor={theme.colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder='Last name'
                placeholderTextColor={theme.colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
            {errors?.fields?.firstName && (
              <Text style={styles.error}>{errors.fields.firstName.message}</Text>
            )}
            {errors?.fields?.lastName && (
              <Text style={styles.error}>{errors.fields.lastName.message}</Text>
            )}

            <TextInput
              style={styles.input}
              autoCapitalize='none'
              keyboardType='email-address'
              placeholder='Email address'
              placeholderTextColor={theme.colors.textMuted}
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
            {errors?.fields?.emailAddress && (
              <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>
            )}

            <TextInput
              style={styles.input}
              secureTextEntry
              placeholder='Password'
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
            />
            {errors?.fields?.password && (
              <Text style={styles.error}>{errors.fields.password.message}</Text>
            )}

            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable
              disabled={isLoading}
              onPress={onSignUp}
              style={({ pressed }) => [
                styles.button,
                isLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>
            <Pressable onPress={onGoogleSignUp} style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}>
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Already have an account?</Text>
              <Link href='/(auth)/sign-in' style={styles.linkAction}>
                Sign in
              </Link>
            </View>

            {/* Required for Clerk's bot protection */}
            <View nativeID='clerk-captcha' />
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the verification code sent to your email.
            </Text>
            <TextInput
              style={styles.input}
              keyboardType='number-pad'
              placeholder='Verification code'
              placeholderTextColor={theme.colors.textMuted}
              value={code}
              onChangeText={setCode}
            />
            {errors?.fields?.code && (
              <Text style={styles.error}>{errors.fields.code.message}</Text>
            )}
            {formError ? <Text style={styles.error}>{formError}</Text> : null}

            <Pressable
              disabled={isLoading}
              onPress={onVerify}
              style={({ pressed }) => [
                styles.button,
                isLoading && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color='#fff' />
              ) : (
                <Text style={styles.buttonText}>Verify email</Text>
              )}
            </Pressable>

            <Pressable
              onPress={async () => {
                await signUp.verifications.sendEmailCode();
              }}
              style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Resend code</Text>
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
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  buttonText: {
    ...theme.typography.bodyStrong,
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
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
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
});
