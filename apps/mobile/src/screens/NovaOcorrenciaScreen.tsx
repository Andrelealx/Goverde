import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const CATEGORIAS = [
  { value: 'DESMATAMENTO', label: 'Desmatamento' },
  { value: 'QUEIMADA', label: 'Queimada' },
  { value: 'RESIDUOS_ILEGAIS', label: 'Resíduos Ilegais' },
  { value: 'POLUICAO_HIDRICA', label: 'Poluição Hídrica' },
  { value: 'POLUICAO_SONORA', label: 'Poluição Sonora' },
  { value: 'FAUNA', label: 'Fauna' },
  { value: 'OUTRO', label: 'Outro' },
];

const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa', color: '#6b7280' },
  { value: 'MEDIA', label: 'Média', color: '#d97706' },
  { value: 'ALTA', label: 'Alta', color: '#ea580c' },
  { value: 'CRITICA', label: 'Crítica', color: '#dc2626' },
];

export default function NovaOcorrenciaScreen() {
  const navigation = useNavigation();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [bairro, setBairro] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [capturandoGps, setCapturandoGps] = useState(false);

  const capturarGPS = async () => {
    setCapturandoGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Acesso à localização necessário.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch { Alert.alert('Erro', 'Não foi possível obter localização.'); }
    finally { setCapturandoGps(false); }
  };

  const tirarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão negada', 'Acesso à câmera necessário.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: false });
    if (!result.canceled && result.assets[0]) setFoto(result.assets[0].uri);
  };

  const enviar = async () => {
    if (!titulo || !categoria) { Alert.alert('Atenção', 'Preencha título e categoria.'); return; }
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descricao', descricao || titulo);
      formData.append('categoria', categoria);
      formData.append('prioridade', prioridade);
      if (bairro) formData.append('bairro', bairro);
      if (coords) {
        formData.append('latitude', String(coords.lat));
        formData.append('longitude', String(coords.lng));
      }
      if (foto) {
        formData.append('fotos', { uri: foto, name: 'foto.jpg', type: 'image/jpeg' } as any);
      }
      await api.post('/api/ocorrencias', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso', 'Ocorrência registrada com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch { Alert.alert('Erro', 'Não foi possível registrar a ocorrência.'); }
    finally { setEnviando(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova Ocorrência</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Título *</Text>
        <TextInput style={styles.input} placeholder="Descreva brevemente" placeholderTextColor="#9ca3af" value={titulo} onChangeText={setTitulo} />

        <Text style={styles.label}>Categoria *</Text>
        <View style={styles.chips}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, categoria === c.value && styles.chipAtivo]}
              onPress={() => setCategoria(c.value)}
            >
              <Text style={[styles.chipText, categoria === c.value && styles.chipTextAtivo]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Prioridade</Text>
        <View style={styles.row}>
          {PRIORIDADES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.chip, prioridade === p.value && { backgroundColor: p.color, borderColor: p.color }]}
              onPress={() => setPrioridade(p.value)}
            >
              <Text style={[styles.chipText, prioridade === p.value && styles.chipTextAtivo]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Detalhes da ocorrência..." placeholderTextColor="#9ca3af" value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} placeholder="Ex: Centro" placeholderTextColor="#9ca3af" value={bairro} onChangeText={setBairro} />

        <TouchableOpacity style={[styles.actionBtn, coords && styles.actionBtnSuccess]} onPress={capturarGPS} disabled={capturandoGps}>
          {capturandoGps
            ? <ActivityIndicator color="#2D6A4F" size="small" />
            : <Text style={styles.actionBtnText}>{coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '📍 Capturar localização GPS'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, foto && styles.actionBtnSuccess]} onPress={tirarFoto}>
          <Text style={styles.actionBtnText}>{foto ? '📷 Foto capturada' : '📷 Tirar foto'}</Text>
        </TouchableOpacity>

        {foto && <Image source={{ uri: foto }} style={styles.fotoPreview} />}

        <TouchableOpacity style={styles.submitBtn} onPress={enviar} disabled={enviando}>
          {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrar Ocorrência</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  backBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  backText: { color: '#2D6A4F', fontWeight: '600', fontSize: 15 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  form: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827' },
  textarea: { height: 100, paddingTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextAtivo: { color: '#fff', fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0', borderRadius: 10, padding: 14, marginTop: 16 },
  actionBtnSuccess: { backgroundColor: '#dcfce7', borderColor: '#4ade80' },
  actionBtnText: { color: '#2D6A4F', fontWeight: '600', fontSize: 14 },
  fotoPreview: { width: '100%', height: 180, borderRadius: 10, marginTop: 12, resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
