import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { buscarDashboardOng, buscarQrRecebimento } from '../services/api';
import ImpactoMensalChart from '../components/ImpactoMensalChart';

export default function OngDashboardScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [qrCodigo, setQrCodigo] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  async function carregar() {
    try {
      const [dash, qr] = await Promise.all([buscarDashboardOng(), buscarQrRecebimento()]);
      setDashboard(dash.data);
      setQrCodigo(qr.data.qr_codigo);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useFocusEffect(useCallback(() => { carregar(); }, []));

  if (carregando) return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" />;

  const resumo = dashboard?.resumo || {};

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} />}
    >
      <Text style={styles.titulo}>Dashboard da ONG</Text>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitulo}>QR de recebimento</Text>
        <QRCode value={qrCodigo || 'doebem'} size={176} />
        <Text style={styles.qrTexto}>Voluntarios escaneiam este QR para confirmar entregas.</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.numero}>{resumo.recebimentos || 0}</Text>
          <Text style={styles.label}>Recebimentos</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.numero}>{resumo.alimentos || 0}</Text>
          <Text style={styles.label}>Alimentos</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.numero}>{resumo.recebimentos_30_dias || 0}</Text>
          <Text style={styles.label}>Ultimos 30 dias</Text>
        </View>
      </View>

      <ImpactoMensalChart dados={dashboard?.mensal || []} titulo="Recebimentos por mes" />

      <Text style={styles.secao}>Recebimentos recentes</Text>
      {(dashboard?.recentes || []).length === 0 ? (
        <Text style={styles.vazio}>Nenhum recebimento confirmado ainda.</Text>
      ) : (
        dashboard.recentes.map((item) => (
          <View key={item.id} style={styles.recebimento}>
            <Text style={styles.recebimentoTitulo}>{item.tipo_alimento}</Text>
            <Text style={styles.recebimentoInfo}>{item.quantidade} unidades</Text>
            <Text style={styles.recebimentoInfo}>Doador: {item.doador_nome || 'Nao informado'}</Text>
            <Text style={styles.recebimentoInfo}>Voluntario: {item.voluntario_nome || 'Nao informado'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  content: { padding: 20, paddingBottom: 48 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrTitulo: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  qrTexto: { fontSize: 12, color: '#616161', textAlign: 'center', marginTop: 12 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  card: {
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
  numero: { fontSize: 24, color: '#2E7D32', fontWeight: 'bold' },
  label: { fontSize: 11, color: '#757575', textAlign: 'center', marginTop: 4 },
  secao: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 10 },
  recebimento: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  recebimentoTitulo: { fontSize: 15, color: '#212121', fontWeight: '700' },
  recebimentoInfo: { fontSize: 12, color: '#616161', marginTop: 3 },
  vazio: { color: '#8A8A8A', fontSize: 13 },
});
