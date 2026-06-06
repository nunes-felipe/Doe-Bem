import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const TIPOS = [
  { valor: 'doador', label: '🏪 Doador', desc: 'Restaurante, mercado ou empresa' },
  { valor: 'voluntario', label: '🚴 Voluntário', desc: 'Realiza as coletas e entregas' },
  { valor: 'ong', label: '🏠 ONG', desc: 'Recebe e distribui os alimentos' },
];

export default function CadastroScreen({ navigation }) {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipo, setTipo] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (!nome || !email || !senha || !tipo) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios e selecione seu tipo.');
      return;
    }
    setCarregando(true);
    try {
      await cadastrar({ nome, email: email.trim(), senha, tipo, telefone });
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Não foi possível cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Criar conta</Text>

      <TextInput style={styles.input} placeholder="Nome completo *" value={nome} onChangeText={setNome} placeholderTextColor="#9E9E9E" />
      <TextInput style={styles.input} placeholder="E-mail *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9E9E9E" />
      <TextInput style={styles.input} placeholder="Senha *" value={senha} onChangeText={setSenha} secureTextEntry placeholderTextColor="#9E9E9E" />
      <TextInput style={styles.input} placeholder="Telefone" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholderTextColor="#9E9E9E" />

      <Text style={styles.labelTipo}>Você é: *</Text>
      {TIPOS.map((t) => (
        <TouchableOpacity
          key={t.valor}
          style={[styles.tipoCard, tipo === t.valor && styles.tipoCardSelecionado]}
          onPress={() => setTipo(t.valor)}
        >
          <Text style={styles.tipoLabel}>{t.label}</Text>
          <Text style={styles.tipoDesc}>{t.desc}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={carregando}>
        {carregando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botaoTexto}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkTexto}>Já tem conta? <Text style={styles.linkDestaque}>Entrar</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 48 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#2E7D32', marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 15, color: '#212121',
  },
  labelTipo: { fontSize: 15, fontWeight: '600', color: '#424242', marginBottom: 10 },
  tipoCard: {
    borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 10,
    padding: 14, marginBottom: 10,
  },
  tipoCardSelecionado: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  tipoLabel: { fontSize: 16, fontWeight: 'bold', color: '#212121' },
  tipoDesc: { fontSize: 13, color: '#757575', marginTop: 2 },
  botao: {
    backgroundColor: '#2E7D32', borderRadius: 10,
    padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 16,
  },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkTexto: { textAlign: 'center', color: '#757575', fontSize: 14 },
  linkDestaque: { color: '#2E7D32', fontWeight: 'bold' },
});
