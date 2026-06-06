import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import DonationMap from '../components/DonationMap';
import {
  cancelarDoacao,
  confirmarEntrega,
  detalheDoacao,
  uploadFoto,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABEL = {
  disponivel: 'Disponivel',
  em_coleta: 'Em coleta',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export default function DoacaoDetalheScreen({ route, navigation }) {
  const { id } = route.params;
  const { usuario } = useAuth();
  const [doacao, setDoacao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [fotoConfirmacao, setFotoConfirmacao] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  async function carregar() {
    try {
      const res = await detalheDoacao(id);
      setDoacao(res.data);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel carregar a doacao.');
    } finally {
      setCarregando(false);
    }
  }

  useFocusEffect(useCallback(() => { carregar(); }, [id]));

  const latitude = Number(doacao?.latitude);
  const longitude = Number(doacao?.longitude);
  const temCoordenadas = Number.isFinite(latitude) && Number.isFinite(longitude);
  const podeCancelar =
    usuario?.tipo === 'doador' &&
    doacao?.doador_id === usuario?.id &&
    ['disponivel', 'em_coleta'].includes(doacao?.status);
  const podeConfirmar =
    usuario?.tipo === 'voluntario' &&
    doacao?.voluntario_id === usuario?.id &&
    doacao?.status === 'em_coleta';

  async function escolherFotoConfirmacao() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos acessar a galeria para anexar a foto.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.65,
    });

    if (!resultado.canceled) {
      setFotoConfirmacao(resultado.assets[0]);
    }
  }

  async function abrirRota() {
    const destino = temCoordenadas
      ? `${latitude},${longitude}`
      : encodeURIComponent(doacao?.endereco || '');
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destino}`);
  }

  async function handleCancelar() {
    Alert.alert('Cancelar doacao', 'Tem certeza que deseja cancelar esta doacao?', [
      { text: 'Nao', style: 'cancel' },
      {
        text: 'Cancelar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelarDoacao(id, 'Cancelada pelo doador');
            Alert.alert('Pronto', 'Doacao cancelada.');
            carregar();
          } catch (err) {
            Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel cancelar.');
          }
        },
      },
    ]);
  }

  async function abrirScanner() {
    if (!permission?.granted) {
      const novaPermissao = await requestPermission();
      if (!novaPermissao.granted) {
        Alert.alert('Permissao necessaria', 'A camera e necessaria para ler o QR Code da ONG.');
        return;
      }
    }
    setScannerAtivo(true);
  }

  async function handleQrScanned({ data }) {
    if (confirmando) return;
    setConfirmando(true);
    setScannerAtivo(false);

    try {
      let fotoUrl = null;
      if (fotoConfirmacao?.base64) {
        const upload = await uploadFoto({
          base64: fotoConfirmacao.base64,
          mime_type: fotoConfirmacao.mimeType || 'image/jpeg',
          nome_arquivo: fotoConfirmacao.fileName || 'confirmacao.jpg',
          pasta: 'confirmacoes',
        });
        fotoUrl = upload.data.url;
      }

      await confirmarEntrega(id, {
        qr_codigo: data,
        foto_confirmacao: fotoUrl,
      });
      Alert.alert('Entrega confirmada', 'A entrega foi registrada para a ONG.');
      await carregar();
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel confirmar a entrega.');
    } finally {
      setConfirmando(false);
    }
  }

  if (carregando || !doacao) {
    return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.voltar}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.titulo}>{doacao.tipo_alimento}</Text>
        <Text style={[styles.status, styles[`status_${doacao.status}`]]}>{STATUS_LABEL[doacao.status]}</Text>
      </View>

      {doacao.foto_url ? <Image source={{ uri: doacao.foto_url }} style={styles.foto} /> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Descricao</Text>
        <Text style={styles.valor}>{doacao.descricao || 'Sem descricao adicional.'}</Text>

        <Text style={styles.label}>Quantidade</Text>
        <Text style={styles.valor}>{doacao.quantidade} unidades</Text>

        <Text style={styles.label}>Validade</Text>
        <Text style={styles.valor}>{new Date(doacao.validade).toLocaleDateString('pt-BR')}</Text>

        <Text style={styles.label}>Endereco</Text>
        <Text style={styles.valor}>{doacao.endereco}</Text>

        <Text style={styles.label}>Doador</Text>
        <Text style={styles.valor}>{doacao.doador_nome || 'Nao informado'}</Text>
      </View>

      {temCoordenadas && (
        <DonationMap
          style={styles.mapa}
          latitude={latitude}
          longitude={longitude}
          title={doacao.tipo_alimento}
          description={doacao.endereco}
        />
      )}

      <TouchableOpacity style={styles.botaoSecundario} onPress={abrirRota}>
        <Text style={styles.botaoSecundarioTexto}>Abrir rota no mapa</Text>
      </TouchableOpacity>

      {podeConfirmar && (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Confirmacao de entrega</Text>
          <TouchableOpacity style={styles.botaoSecundario} onPress={escolherFotoConfirmacao}>
            <Text style={styles.botaoSecundarioTexto}>
              {fotoConfirmacao ? 'Trocar foto de confirmacao' : 'Anexar foto de confirmacao'}
            </Text>
          </TouchableOpacity>
          {fotoConfirmacao?.uri ? <Image source={{ uri: fotoConfirmacao.uri }} style={styles.preview} /> : null}
          <TouchableOpacity style={styles.botao} onPress={abrirScanner} disabled={confirmando}>
            {confirmando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoTexto}>Escanear QR da ONG</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {podeCancelar && (
        <TouchableOpacity style={styles.botaoCancelar} onPress={handleCancelar}>
          <Text style={styles.botaoCancelarTexto}>Cancelar doacao</Text>
        </TouchableOpacity>
      )}

      {scannerAtivo && (
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerTitulo}>Aponte para o QR da ONG</Text>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleQrScanned}
          />
          <TouchableOpacity style={styles.botaoSecundario} onPress={() => setScannerAtivo(false)}>
            <Text style={styles.botaoSecundarioTexto}>Fechar scanner</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  content: { padding: 20, paddingBottom: 48 },
  voltar: { color: '#2E7D32', fontWeight: '700', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  titulo: { flex: 1, fontSize: 23, color: '#212121', fontWeight: 'bold', marginBottom: 12 },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, overflow: 'hidden' },
  status_disponivel: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  status_em_coleta: { backgroundColor: '#FFF8E1', color: '#FF8F00' },
  status_entregue: { backgroundColor: '#E3F2FD', color: '#1565C0' },
  status_cancelada: { backgroundColor: '#FFEBEE', color: '#C62828' },
  foto: { width: '100%', height: 190, borderRadius: 8, marginBottom: 14, backgroundColor: '#E0E0E0' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  label: { fontSize: 12, color: '#757575', marginTop: 10, marginBottom: 3, fontWeight: '700' },
  valor: { fontSize: 14, color: '#212121' },
  mapa: { width: '100%', height: 210, borderRadius: 8, marginBottom: 12 },
  botao: { backgroundColor: '#2E7D32', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    padding: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  botaoSecundarioTexto: { color: '#2E7D32', fontWeight: '700' },
  botaoCancelar: {
    borderWidth: 1,
    borderColor: '#C62828',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoCancelarTexto: { color: '#C62828', fontWeight: 'bold' },
  preview: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  scannerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scannerTitulo: { fontSize: 15, fontWeight: '700', color: '#212121', marginBottom: 10 },
  camera: { height: 280, borderRadius: 8, overflow: 'hidden', marginBottom: 12 },
});
