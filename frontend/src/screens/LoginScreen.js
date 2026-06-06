import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleLogin() {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Não foi possível fazer login.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoBox}>
        <Text style={styles.logo}>💚</Text>
        <Text style={styles.titulo}>DoeBem</Text>
        <Text style={styles.subtitulo}>Conectando alimentos a quem precisa</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        placeholderTextColor="#9E9E9E"
      />

      <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={carregando}>
        {carregando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botaoTexto}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.linkTexto}>Não tem conta? <Text style={styles.linkDestaque}>Cadastre-se</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', paddingHorizontal: 28 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64 },
  titulo: { fontSize: 32, fontWeight: 'bold', color: '#2E7D32', marginTop: 8 },
  subtitulo: { fontSize: 14, color: '#757575', marginTop: 4, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 15, color: '#212121',
  },
  botao: {
    backgroundColor: '#2E7D32', borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkTexto: { textAlign: 'center', color: '#757575', fontSize: 14 },
  linkDestaque: { color: '#2E7D32', fontWeight: 'bold' },
});
