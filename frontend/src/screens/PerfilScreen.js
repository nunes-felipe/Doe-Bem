import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { buscarPerfil, buscarImpacto, buscarImpactoMensal } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImpactoMensalChart from '../components/ImpactoMensalChart';

const TIPO_LABEL = { doador: 'Doador', voluntario: 'Voluntario', ong: 'ONG' };

export default function PerfilScreen() {
  const { sair } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [impacto, setImpacto] = useState(null);
  const [mensal, setMensal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([buscarPerfil(), buscarImpacto(), buscarImpactoMensal()])
      .then(([p, i, m]) => {
        setPerfil(p.data);
        setImpacto(i.data);
        setMensal(m.data);
      })
      .catch(() => Alert.alert('Erro', 'Nao foi possivel carregar o perfil.'))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetra}>{perfil?.nome?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.nome}>{perfil?.nome}</Text>
        <Text style={styles.tipo}>{TIPO_LABEL[perfil?.tipo]}</Text>
        <Text style={styles.email}>{perfil?.email}</Text>
      </View>

      <Text style={styles.secao}>Meu impacto</Text>
      <View style={styles.impactoGrid}>
        <View style={styles.impactoCard}>
          <Text style={styles.impactoNum}>{impacto?.doacoes_realizadas || 0}</Text>
          <Text style={styles.impactoLabel}>Doacoes</Text>
        </View>
        <View style={styles.impactoCard}>
          <Text style={styles.impactoNum}>{impacto?.alimentos_doados || impacto?.alimentos_recebidos || 0}</Text>
          <Text style={styles.impactoLabel}>Alimentos</Text>
        </View>
        <View style={styles.impactoCard}>
          <Text style={styles.impactoNum}>{impacto?.coletas_realizadas || impacto?.recebimentos_ong || 0}</Text>
          <Text style={styles.impactoLabel}>{perfil?.tipo === 'ong' ? 'Recebidos' : 'Coletas'}</Text>
        </View>
      </View>

      <ImpactoMensalChart dados={mensal} titulo="Evolucao mensal" />

      <TouchableOpacity style={styles.botaoSair} onPress={() => {
        Alert.alert('Sair', 'Tem certeza que deseja sair?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: sair },
        ]);
      }}>
        <Text style={styles.botaoSairTexto}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  content: { padding: 24, paddingBottom: 48 },
  header: { alignItems: 'center', marginTop: 32, marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetra: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  nome: { fontSize: 22, fontWeight: 'bold', color: '#212121', textAlign: 'center' },
  tipo: { fontSize: 15, color: '#2E7D32', fontWeight: '600', marginTop: 4 },
  email: { fontSize: 13, color: '#9E9E9E', marginTop: 4 },
  secao: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 12 },
  impactoGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  impactoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactoNum: { fontSize: 24, fontWeight: 'bold', color: '#2E7D32' },
  impactoLabel: { fontSize: 12, color: '#757575', marginTop: 4 },
  botaoSair: {
    borderWidth: 1.5,
    borderColor: '#E53935',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  botaoSairTexto: { color: '#E53935', fontWeight: 'bold', fontSize: 15 },
});
