import { useAuth } from '@clerk/expo';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '@/src/components/common/AppButton';
import { AppHeader } from '@/src/components/common/AppHeader';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/common/StateViews';
import { ScreenWrapper } from '@/src/components/common/ScreenWrapper';
import { inquiryApi } from '@/src/services/api/inquiry.api';
import { Inquiry } from '@/src/types/inquiry';
import { theme } from '@/src/theme';
import { formatDate } from '@/src/utils/format';

export const OwnerInquiriesScreen = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    getTokenRef.current = getToken;
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await inquiryApi.getMyReceivedInquiries(getTokenRef.current);
      setItems(response.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitReply = async (id: string) => {
    if (!replyMessage.trim()) return;
    try {
      const response = await inquiryApi.replyToInquiry(id, replyMessage.trim(), getTokenRef.current);
      setItems((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      setReplyingId(null);
      setReplyMessage('');
    } catch (error) {
      Alert.alert('Reply failed', error instanceof Error ? error.message : 'Try again');
    }
  };

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader title='Owner Inquiries' subtitle='Respond to your property inquiries' />
      {loading ? <LoadingState message='Loading inquiries...' /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.subject}>{item.subject || 'Inquiry'}</Text>
              <Text style={styles.meta}>Status: {item.inquiryStatus}</Text>
              <Text style={styles.meta}>Created: {formatDate(item.createdAt)}</Text>
              <Text style={styles.message}>{item.message}</Text>
              {item.replyMessage ? <Text style={styles.reply}>Reply: {item.replyMessage}</Text> : null}
              {replyingId === item._id ? (
                <View style={styles.replyBox}>
                  <TextInput
                    style={styles.input}
                    value={replyMessage}
                    onChangeText={setReplyMessage}
                    placeholder='Write your reply'
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <AppButton label='Send Reply' onPress={() => submitReply(item._id)} />
                </View>
              ) : (
                <AppButton label='Reply' variant='secondary' onPress={() => setReplyingId(item._id)} />
              )}
            </View>
          )}
          ListEmptyComponent={<EmptyState title='No inquiries yet' message='New inquiries will appear here.' />}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: 6,
  },
  subject: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
  },
  meta: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  reply: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  replyBox: {
    gap: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    height: 44,
    color: theme.colors.textPrimary,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
});
