import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/auth.store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !senha) { Alert.alert('Atenção', 'Preencha e-mail e senha.'); return; }
    setCarregando(true);
    try {
      await login(email.trim().toLowerCase(), senha);
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>
        <Text style={styles.title}>Goverde</Text>
        <Text style={styles.subtitle}>Sistema de Gestão Ambiental</Text>

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <Text style={styles.footer}>Goverde · Prefeituras Inteligentes</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logo: { width: 64, height: 64, backgroundColor: '#2D6A4F', borderRadius: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#2D6A4F', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  button: { backgroundColor: '#2D6A4F', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 24 },
});
