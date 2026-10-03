import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { TransactionListItem } from '@/components/TransactionListItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { getTransactions } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import { Transaction } from '@/lib/types';

export default function TransactionsListScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Could not load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingView label="Loading transactions…" />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchTransactions} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyView title="No transactions yet" subtitle="Authorize a new transaction to get started." />}
      />
      <View style={styles.footer}>
        <PrimaryButton label="New transaction" onPress={() => router.push('/transactions/authorize')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
