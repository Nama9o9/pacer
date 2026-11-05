import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/utils/supabase';

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Bitte alle Felder ausfüllen.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // display_name landet in den Metadaten und wird vom
    // Datenbank-Trigger handle_new_user in profiles übernommen
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
    }
    setIsSubmitting(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Konto erstellen</Text>
        <Text style={styles.subtitle}>Danach legst du dein Ziel fest.</Text>

        <TextInput
          style={styles.input}
          placeholder="Wie sollen wir dich nennen?"
          autoComplete="name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          style={styles.input}
          placeholder="E-Mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Passwort"
          secureTextEntry
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleRegister} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Konto erstellen</Text>
          )}
        </Pressable>

        <Link href="/login" style={styles.link}>
          Schon ein Konto? Anmelden
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

// Farben vorerst hier, später aus der zentralen Theme-Datei
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 16, color: '#475569', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  error: { color: '#B91C1C', fontSize: 14 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563EB', fontSize: 15, textAlign: 'center', marginTop: 8 },
});
