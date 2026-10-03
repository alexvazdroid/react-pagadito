import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { CardListItem } from '@/components/CardListItem';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { getCards } from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import { Card } from '@/lib/types';

export default function CardsListScreen() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setError(null);
    try {
      const data = await getCards();
      setCards(data);
      setLoading(false);
    } catch (err) {
      setError('Could not load cards.');
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, [fetchCards])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingView label="Loading cards…" />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchCards} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.token}
        renderItem={({ item }) => (
          <CardListItem card={item} onPress={() => router.push(`/cards/${item.token}`)} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyView title="No cards yet" subtitle="Add a card to get started." />}
      />
      <View style={styles.footer}>
        <PrimaryButton label="Add card" onPress={() => router.push('/cards/add')} />
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
