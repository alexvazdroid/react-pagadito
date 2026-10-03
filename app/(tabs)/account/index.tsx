import { StyleSheet, Text, View, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { getMe, deleteMe } from '@/lib/api';
import { setSessionToken } from '@/lib/session';
import { User } from '@/lib/types';
import { router } from 'expo-router';

export default function AccountScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMe();
      setUser(data);
    } catch (err) {
      setError('Failed to load user information.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSessionToken(null);
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This is destructive and permanent. All your transactions will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteMe();
              setSessionToken(null);
              router.replace('/');
            } catch (err) {
              Alert.alert('Error', 'Failed to delete account.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUser}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfoCard}>
        <Text style={styles.userInitial}>{user?.email?.charAt(0).toUpperCase()}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userJoined}>Joined: {new Date(user?.createdAt || '').toDateString()}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  userInfoCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  userInitial: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    color: colors.primaryText,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 64,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  userEmail: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userJoined: {
    fontSize: 12,
    color: colors.inactive,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(216, 73, 58, 0.1)',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(216, 73, 58, 0.2)',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
