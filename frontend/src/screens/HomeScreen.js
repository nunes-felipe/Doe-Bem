import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { buscarImpacto, buscarImpactoMensal } from '../services/api';
import { configurarNotificacoesPush } from '../services/notifications';
import ImpactoMensalChart from '../components/ImpactoMensalChart';

export default function HomeScreen({ navigation }) {
  const { usuario, sair } = useAuth();
  const [impacto, setImpacto] = useState(null);
  const [mensal, setMensal] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    configurarNotificacoesPush();
  }, []);

  useEffect(() => {
    Promise.all([buscarImpacto(), buscarImpactoMensal()])
      .then(([resImpacto, resMensal]) => {
        setImpacto(resImpacto.data);
        setMensal(resMensal.data);
      })
      .catch(() => {
        setImpacto({
          doacoes_realizadas: 0,
          alimentos_doados: 0,
          coletas_realizadas: 0,
          recebimentos_ong: 0,
          alimentos_recebidos: 0,
        });
        setMensal([]);
      })
      .finally(() => setCarregando(false));
  }, []);

  const cards = [
    { valor: impacto?.doacoes_realizadas || 0, label: 'Doacoes' },
    { valor: impacto?.alimentos_doados || impacto?.alimentos_recebidos || 0, label: 'Alimentos' },
    { valor: impacto?.coletas_realizadas || impacto?.recebimentos_ong || 0, label: usuario?.tipo === 'ong' ? 'Recebidos' : 'Coletas' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.saudacao}>Ola, {usuario?.nome?.split(' ')[0]}!</Text>
          <Text style={styles.subtitulo}>Acompanhe suas doacoes e entregas</Text>
        </View>
        <TouchableOpacity onPress={sair}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.impactoGrid}>
            {cards.map((card) => (
              <View key={card.label} style={styles.impactoCard}>
                <Text style={styles.impactoNumero}>{card.valor}</Text>
                <Text style={styles.impactoLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
          <ImpactoMensalChart dados={mensal} />
        </>
      )}

      <Text style={styles.secaoTitulo}>Acoes rapidas</Text>

      {usuario?.tipo === 'doador' && (
        <TouchableOpacity style={styles.acaoCard} onPress={() => navigation.navigate('Nova Doacao')}>
          <Text style={styles.acaoIcone}>+</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.acaoTitulo}>Nova doacao</Text>
            <Text style={styles.acaoDesc}>Cadastrar alimentos disponiveis</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.acaoCard} onPress={() => navigation.navigate('Doacoes')}>
        <Text style={styles.acaoIcone}>D</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.acaoTitulo}>Doacoes</Text>
          <Text style={styles.acaoDesc}>Ver disponiveis, coletas e historico</Text>
        </View>
      </TouchableOpacity>

      {usuario?.tipo === 'ong' && (
        <TouchableOpacity style={styles.acaoCard} onPress={() => navigation.navigate('ONG')}>
          <Text style={styles.acaoIcone}>Q</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.acaoTitulo}>QR de recebimento</Text>
            <Text style={styles.acaoDesc}>Abrir dashboard da ONG</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.acaoCard} onPress={() => navigation.navigate('Alertas')}>
        <Text style={styles.acaoIcone}>!</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.acaoTitulo}>Alertas</Text>
          <Text style={styles.acaoDesc}>Notificacoes de coletas e entregas</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  content: { padding: 24, paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, gap: 16 },
  saudacao: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
  subtitulo: { fontSize: 13, color: '#757575', marginTop: 2 },
  sair: { color: '#E53935', fontSize: 14, fontWeight: '600' },
  impactoGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  impactoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactoNumero: { fontSize: 27, fontWeight: 'bold', color: '#2E7D32' },
  impactoLabel: { fontSize: 12, color: '#757575', textAlign: 'center', marginTop: 4 },
  secaoTitulo: { fontSize: 17, fontWeight: 'bold', color: '#212121', marginBottom: 14 },
  acaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  acaoIcone: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  acaoTitulo: { fontSize: 15, fontWeight: 'bold', color: '#212121' },
  acaoDesc: { fontSize: 13, color: '#757575', marginTop: 2 },
});
