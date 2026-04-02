import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';

interface RegistroPonto { id: string; tipo: string; criadoEm: string; enderecoAprox?: string; }
interface Resumo { registrosHoje: RegistroPonto[]; proximoTipo: string | null; encerrado: boolean; }

const TIPO_LABEL: Record<string, string> = {
  ENTRADA: 'Entrada', ALMOCO_SAIDA: 'Saída Almoço', ALMOCO_VOLTA: 'Volta Almoço', SAIDA: 'Saída',
};
const TIPO_EMOJI: Record<string, string> = {
  ENTRADA: '🟢', ALMOCO_SAIDA: '🟡', ALMOCO_VOLTA: '🔵', SAIDA: '🔴',
};

export default function PontoScreen() {
  const { usuario } = useAuthStore();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get<Resumo>('/api/ponto/resumo');
      setResumo(data);
    } catch {}
    finally { setCarregando(false); setRefreshing(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const registrar = async () => {
    if (!resumo?.proximoTipo) return;
    setRegistrando(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão negada', 'Localização necessária para registrar ponto.'); setRegistrando(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await api.post('/api/ponto', {
        tipo: resumo.proximoTipo,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        precisao: loc.coords.accuracy,
        verificacaoFacial: false,
      });
      Alert.alert('✅ Registrado!', `${TIPO_LABEL[resumo.proximoTipo]} registrada com sucesso.`);
      carregar();
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.message ?? 'Não foi possível registrar o ponto.');
    } finally { setRegistrando(false); }
  };

  if (carregando) return <View style={styles.center}><ActivityIndicator color="#2D6A4F" size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#2D6A4F" />}
      >
        <Text style={styles.title}>Ponto Eletrônico</Text>
        <Text style={styles.sub}>{usuario?.nome}</Text>

        {/* Botão principal */}
        {resumo?.encerrado ? (
          <View style={styles.encerradoCard}>
            <Text style={styles.encerradoEmoji}>✅</Text>
            <Text style={styles.encerradoTitle}>Jornada encerrada</Text>
            <Text style={styles.encerradoSub}>Todos os registros do dia foram concluídos.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.registerBtn} onPress={registrar} disabled={registrando || !resumo?.proximoTipo}>
            {registrando
              ? <ActivityIndicator color="#fff" size="large" />
              : (
                <>
                  <Text style={styles.registerEmoji}>{TIPO_EMOJI[resumo?.proximoTipo ?? ''] ?? '⏱️'}</Text>
                  <Text style={styles.registerLabel}>Registrar</Text>
                  <Text style={styles.registerTipo}>{TIPO_LABEL[resumo?.proximoTipo ?? ''] ?? '...'}</Text>
                </>
              )}
          </TouchableOpacity>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>📍 Localização GPS capturada automaticamente</Text>
          <Text style={styles.infoText}>🔒 Verificação facial disponível no painel web</Text>
        </View>

        {/* Registros de hoje */}
        <Text style={styles.sectionTitle}>Hoje</Text>
        {resumo?.registrosHoje.length === 0 ? (
          <Text style={styles.empty}>Nenhum registro hoje.</Text>
        ) : (
          resumo?.registrosHoje.map((r) => (
            <View key={r.id} style={styles.registroItem}>
              <Text style={styles.registroEmoji}>{TIPO_EMOJI[r.tipo] ?? '•'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.registroTipo}>{TIPO_LABEL[r.tipo] ?? r.tipo}</Text>
                {r.enderecoAprox && <Text style={styles.registroEndereco}>{r.enderecoAprox}</Text>}
              </View>
              <Text style={styles.registroHora}>
                {new Date(r.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 28 },
  registerBtn: { backgroundColor: '#2D6A4F', borderRadius: 20, paddingVertical: 40, alignItems: 'center', marginBottom: 16, shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  registerEmoji: { fontSize: 48, marginBottom: 8 },
  registerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  registerTipo: { color: '#fff', fontSize: 24, fontWeight: '700' },
  encerradoCard: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingVertical: 40, alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#bbf7d0' },
  encerradoEmoji: { fontSize: 48, marginBottom: 8 },
  encerradoTitle: { fontSize: 20, fontWeight: '700', color: '#2D6A4F', marginBottom: 4 },
  encerradoSub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 24, gap: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  infoText: { fontSize: 12, color: '#6b7280' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  empty: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  registroItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  registroEmoji: { fontSize: 22 },
  registroTipo: { fontSize: 14, fontWeight: '600', color: '#111827' },
  registroEndereco: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  registroHora: { fontSize: 16, fontWeight: '700', color: '#2D6A4F', fontVariant: ['tabular-nums'] },
});
