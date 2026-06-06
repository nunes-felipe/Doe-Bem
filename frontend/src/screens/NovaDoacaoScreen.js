import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { criarDoacao, uploadFoto } from '../services/api';

function formatarEndereco(lugar) {
  const rua = [lugar.street, lugar.streetNumber].filter(Boolean).join(', ');
  const cidade = [lugar.district, lugar.city].filter(Boolean).join(' - ');
  return [rua, cidade].filter(Boolean).join(' - ');
}

function parseValidade(valor) {
  const [dia, mes, ano] = valor.split('/');
  if (!dia || !mes || !ano) return null;
  const data = new Date(`${ano}-${mes}-${dia}T12:00:00`);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

export default function NovaDoacaoScreen({ navigation }) {
  const [tipoAlimento, setTipoAlimento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState('');
  const [endereco, setEndereco] = useState('');
  const [coordenadas, setCoordenadas] = useState(null);
  const [fotoAsset, setFotoAsset] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function escolherFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.65,
    });

    if (!resultado.canceled) {
      setFotoAsset(resultado.assets[0]);
    }
  }

  async function usarLocalizacao() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissao necessaria', 'Precisamos de acesso a localizacao.');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setCoordenadas({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    const [lugar] = await Location.reverseGeocodeAsync(loc.coords);
    if (lugar) {
      setEndereco(formatarEndereco(lugar));
    }
  }

  async function enviarFotoSeNecessario() {
    if (!fotoAsset?.base64) return null;

    const res = await uploadFoto({
      base64: fotoAsset.base64,
      mime_type: fotoAsset.mimeType || 'image/jpeg',
      nome_arquivo: fotoAsset.fileName || 'doacao.jpg',
      pasta: 'doacoes',
    });

    return res.data.url;
  }

  async function handlePublicar() {
    if (!tipoAlimento || !quantidade || !validade || !endereco) {
      Alert.alert('Atencao', 'Preencha todos os campos obrigatorios.');
      return;
    }

    const validadeIso = parseValidade(validade);
    if (!validadeIso) {
      Alert.alert('Atencao', 'Informe a validade no formato DD/MM/AAAA.');
      return;
    }

    setCarregando(true);
    try {
      const fotoUrl = await enviarFotoSeNecessario();
      await criarDoacao({
        tipo_alimento: tipoAlimento,
        descricao,
        quantidade: parseInt(quantidade, 10),
        validade: validadeIso,
        endereco,
        latitude: coordenadas?.latitude,
        longitude: coordenadas?.longitude,
        foto_url: fotoUrl,
      });
      Alert.alert('Doacao publicada!', 'Voluntarios proximos serao notificados.', [
        { text: 'OK', onPress: () => navigation.navigate('Doacoes') },
      ]);
      setTipoAlimento('');
      setDescricao('');
      setQuantidade('');
      setValidade('');
      setEndereco('');
      setCoordenadas(null);
      setFotoAsset(null);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.erro || 'Nao foi possivel publicar a doacao.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.titulo}>Nova doacao</Text>

      <Text style={styles.label}>Tipo de alimento *</Text>
      <TextInput style={styles.input} placeholder="Ex: Marmitas, frutas, paes" value={tipoAlimento} onChangeText={setTipoAlimento} placeholderTextColor="#9E9E9E" />

      <Text style={styles.label}>Descricao</Text>
      <TextInput style={[styles.input, styles.inputMultilinha]} placeholder="Detalhes adicionais" value={descricao} onChangeText={setDescricao} multiline numberOfLines={3} placeholderTextColor="#9E9E9E" />

      <Text style={styles.label}>Quantidade *</Text>
      <TextInput style={styles.input} placeholder="Ex: 20" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" placeholderTextColor="#9E9E9E" />

      <Text style={styles.label}>Data de validade * (DD/MM/AAAA)</Text>
      <TextInput style={styles.input} placeholder="Ex: 25/05/2026" value={validade} onChangeText={setValidade} keyboardType="numeric" placeholderTextColor="#9E9E9E" />

      <Text style={styles.label}>Local de retirada *</Text>
      <View style={styles.enderecoRow}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Rua, numero - Bairro" value={endereco} onChangeText={setEndereco} placeholderTextColor="#9E9E9E" />
        <TouchableOpacity style={styles.botaoGps} onPress={usarLocalizacao}>
          <Text style={styles.botaoGpsTexto}>GPS</Text>
        </TouchableOpacity>
      </View>
      {coordenadas ? <Text style={styles.coords}>Localizacao salva para rota e proximidade.</Text> : null}

      <Text style={styles.label}>Foto do alimento</Text>
      <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
        {fotoAsset?.uri ? (
          <Image source={{ uri: fotoAsset.uri }} style={styles.preview} />
        ) : (
          <Text style={styles.botaoFotoTexto}>Adicionar foto</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.botao} onPress={handlePublicar} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Publicar doacao</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FBF9' },
  content: { padding: 24, paddingBottom: 48 },
  titulo: { fontSize: 22, fontWeight: 'bold', color: '#212121', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    color: '#212121',
  },
  inputMultilinha: { height: 90, textAlignVertical: 'top' },
  enderecoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  botaoGps: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  botaoGpsTexto: { color: '#2E7D32', fontWeight: '700' },
  coords: { fontSize: 12, color: '#2E7D32', marginTop: -10, marginBottom: 14 },
  botaoFoto: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  botaoFotoTexto: { color: '#757575', fontSize: 15, fontWeight: '600' },
  preview: { width: '100%', height: '100%', borderRadius: 8 },
  botao: { backgroundColor: '#2E7D32', borderRadius: 8, padding: 16, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
