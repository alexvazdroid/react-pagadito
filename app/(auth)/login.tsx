import { useState } from 'react';
import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TextField } from '@/components/TextField';
import { login } from '@/lib/api';
import { setSessionToken } from '@/lib/session';
import { colors, spacing } from '@/lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email: email.trim(), password });
      setSessionToken(response.token);
      router.replace('/cards');
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      if (router.canGoBack() || true) {
        // Prevent update warning on unmounted component
      }
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 8 characters"
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <PrimaryButton 
        label="Log in" 
        onPress={handleLogin} 
        loading={loading} 
        style={styles.button}
      />

      <Link href="/signup" style={styles.link}>
        Don't have an account? Sign up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  form: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginBottom: spacing.xl,
  },
  link: {
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
