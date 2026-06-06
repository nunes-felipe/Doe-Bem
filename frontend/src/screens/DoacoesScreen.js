import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  aceitarColeta,
  cancelarDoacao,
  listarDoacoes,
  listarMinhasDoacoes,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
  disponivel: 'Disponivel',
  em_coleta: 'Em coleta',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

function CardDoacao({ item, onAceitar, onCancelar, onDetalhes, usuario }) {
  const diasParaVencer = Math.ceil((new Date(item.validade) - new Date()) / (1000 * 60 * 60 * 24));
  const urgente = diasParaVencer <= 1;
  const isVoluntario = usuario?.tipo === 'voluntario';
  const podeAceitar = isVoluntario && item.status === 'disponivel';
  const podeCancelar =
    usuario?.tipo === 'doador' &&
    item.doador_id === usuario?.id &&
    ['disponivel', 'em_coleta'].includes(item.status);

  return (
    <View style={[styles.card, urgente && item.status === 'disponivel' && styles.cardUrgente]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>{item.tipo_alimento}</Text>
        <Text style={[styles.status, styles[`status_${item.status}`]]}>
          {STATUS_LABEL[item.status] || item.status}
        </Text>
      </View>
      {urgente && item.status === 'disponivel' && <Text style={styles.badge}>Vence em breve</Text>}
      <Text style={styles.cardDesc}>{item.descricao || 'Sem descricao adicional.'}</Text>
      <View style={styles.cardInfo}>
        <Text style={styles.cardDetalhe}>Quantidade: {item.quantidade} unidades</Text>
        <Text style={styles.cardDetalhe}>Validade: {new Date(item.validade).toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.cardDetalhe}>Endereco: {item.endereco}</Text>
        {item.distancia_km ? (
          <Text style={styles.cardDetalhe}>Distancia: {item.distancia_km} km</Text>
        ) : null}
      </View>
      <View style={styles.acoes}>
        <TouchableOpacity style={styles.botaoSecundario} onPress={() => onDetalhes(item.id)}>
          <Text style={styles.botaoSecundarioTexto}>Detalhes</Text>
        </TouchableOpacity>
        {podeAceitar && (
          <TouchableOpacity style={styles.botaoAceitar} onPress={() => onAceitar(item.id)}>
            <Text style={styles.botaoAceitarTexto}>Aceitar</Text>
          </TouchableOpacity>
        )}
        {podeCancelar && (
          <TouchableOpacity style={styles.botaoCancelar} onPress={() => onCancelar(item.id)}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function DoacoesScreen({ navigation }) {
  const { usuario } = useAuth();
  const [aba, setAba] = useState('disponiveis');
  const [doacoes, setDoacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregarDoacoes(abaAtual = aba) {
    try {
      if (abaAtual === 'minhas') {
        const res = await listarMinhasDoacoes();
        setDoacoes(res.data);
      } else {
        let lat;
        let lng;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
        const res = await listarDoacoes(lat, lng);
        setDoacoes(res.data);
      }
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel carregar as doacoes.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useFocusEffect(useCallback(() => { carregarDoacoes(); }, [aba]));

  function trocarAba(novaAba) {
    setAba(novaAba);
    setCarregando(true);
    carregarDoacoes(novaAba);
  }

  async function handleAceitar(id) {
    Alert.alert('Confirmar', 'Deseja aceitar esta coleta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aceitar',
        onPress: async () => {
          try {
            await aceitarColeta(id);
            Alert.alert('Coleta aceita', 'Abra os detalhes para ver rota e confirmar a entrega.');
            trocarAba('minhas');
          } catch (err) {
            Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel aceitar.');
          }
        },
      },
    ]);
  }

  async function handleCancelar(id) {
    Alert.alert('Cancelar doacao', 'Deseja cancelar esta doacao?', [
      { text: 'Nao', style: 'cancel' },
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelarDoacao(id, 'Cancelada pelo doador');
            Alert.alert('Pronto', 'Doacao cancelada.');
            carregarDoacoes();
          } catch (err) {
            Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel cancelar.');
          }
        },
      },
    ]);
  }

  if (carregando) return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{aba === 'minhas' ? 'Minhas doacoes' : 'Doacoes disponiveis'}</Text>

      <View style={styles.abas}>
        <TouchableOpacity
          style={[styles.aba, aba === 'disponiveis' && styles.abaAtiva]}
          onPress={() => trocarAba('disponiveis')}
        >
          <Text style={[styles.abaTexto, aba === 'disponiveis' && styles.abaTextoAtivo]}>Disponiveis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aba, aba === 'minhas' && styles.abaAtiva]}
          onPress={() => trocarAba('minhas')}
        >
          <Text style={[styles.abaTexto, aba === 'minhas' && styles.abaTextoAtivo]}>Minhas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={doacoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardDoacao
            item={item}
            usuario={usuario}
            onAceitar={handleAceitar}
            onCancelar={handleCancelar}
            onDetalhes={(doacaoId) => navigation.navigate('DetalheDoacao', { id: doacaoId })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregarDoacoes(); }} tintColor="#2E7D32" />
        }
        ListEmptyComponent={
          <Text style={styles.vazio}>
            {aba === 'minhas' ? 'Nenhuma doacao relacionada a voce ainda.' : 'Nenhuma doacao disponivel no momento.'}
          </Text>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#212121', padding: 24, paddingBottom: 8 },
  abas: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#EDEDED',
  },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 6 },
  abaAtiva: { backgroundColor: '#fff' },
  abaTexto: { color: '#757575', fontWeight: '700', fontSize: 13 },
  abaTextoAtivo: { color: '#2E7D32' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardUrgente: { borderLeftWidth: 4, borderLeftColor: '#FF6F00' },
  badge: { color: '#FF6F00', fontWeight: 'bold', fontSize: 12, marginBottom: 6 },
  cardTitulo: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#212121' },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 11, overflow: 'hidden' },
  status_disponivel: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  status_em_coleta: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
  status_entregue: { backgroundColor: '#E3F2FD', color: '#1565C0' },
  status_cancelada: { backgroundColor: '#FFEBEE', color: '#C62828' },
  cardDesc: { fontSize: 14, color: '#757575', marginTop: 4, marginBottom: 10 },
  cardInfo: { gap: 4 },
  cardDetalhe: { fontSize: 13, color: '#424242' },
  acoes: { flexDirection: 'row', gap: 8, marginTop: 14 },
  botaoAceitar: { flex: 1, backgroundColor: '#2E7D32', borderRadius: 8, padding: 11, alignItems: 'center' },
  botaoAceitarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  botaoSecundario: { flex: 1, borderWidth: 1, borderColor: '#2E7D32', borderRadius: 8, padding: 11, alignItems: 'center' },
  botaoSecundarioTexto: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
  botaoCancelar: { flex: 1, borderWidth: 1, borderColor: '#C62828', borderRadius: 8, padding: 11, alignItems: 'center' },
  botaoCancelarTexto: { color: '#C62828', fontWeight: 'bold', fontSize: 14 },
  vazio: { textAlign: 'center', color: '#9E9E9E', marginTop: 60, fontSize: 15 },
});
