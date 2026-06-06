import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarNotificacoes, marcarNotificacaoLida } from '../services/api';

export default function NotificacoesScreen({ navigation }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregar() {
    try {
      const res = await listarNotificacoes();
      setNotificacoes(res.data);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useFocusEffect(useCallback(() => { carregar(); }, []));

  async function abrirNotificacao(item) {
    if (!item.lida) {
      await marcarNotificacaoLida(item.id).catch(() => {});
    }
    const doacaoId = item.dados?.doacao_id;
    if (doacaoId) {
      navigation.navigate('DetalheDoacao', { id: doacaoId });
    } else {
      carregar();
    }
  }

  if (carregando) return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Alertas</Text>
      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.lida && styles.cardNaoLido]}
            onPress={() => abrirNotificacao(item)}
          >
            <Text style={styles.cardTitulo}>{item.titulo}</Text>
            <Text style={styles.cardMensagem}>{item.mensagem}</Text>
            <Text style={styles.cardData}>{new Date(item.criado_em).toLocaleString('pt-BR')}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.vazio}>Nenhum alerta por enquanto.</Text>}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#212121', padding: 24, paddingBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  cardNaoLido: { borderColor: '#2E7D32', backgroundColor: '#F4FBF4' },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: '#212121' },
  cardMensagem: { fontSize: 13, color: '#616161', marginTop: 4 },
  cardData: { fontSize: 11, color: '#9E9E9E', marginTop: 8 },
  vazio: { textAlign: 'center', color: '#9E9E9E', marginTop: 60, fontSize: 15 },
});
