import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import Badge from '../components/Badge';
import { formatDateTime } from '../utils/formatters';

interface Vistoria {
  id: string;
  dataAgendada: string;
  dataRealizada: string | null;
  status: string;
  observacoes: string | null;
  fiscal: { nome: string };
  licenca: { protocolo: string; requerente: string } | null;
}

const STATUS_FILTROS = [
  { label: 'Todas', value: '' },
  { label: 'Agendada', value: 'AGENDADA' },
  { label: 'Realizada', value: 'REALIZADA' },
  { label: 'Cancelada', value: 'CANCELADA' },
];

const STATUS_COLOR: Record<string, string> = {
  AGENDADA: '#2563eb', REALIZADA: '#16a34a', CANCELADA: '#6b7280',
};
const STATUS_LABEL: Record<string, string> = {
  AGENDADA: 'Agendada', REALIZADA: 'Realizada', CANCELADA: 'Cancelada',
};

export default function VistoriasScreen() {
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const params = statusFiltro ? { status: statusFiltro } : {};
      const { data } = await api.get<Vistoria[]>('/api/vistorias', { params });
      setVistorias(data);
    } catch {}
    finally { setCarregando(false); setRefreshing(false); }
  }, [statusFiltro]);

  useEffect(() => { setCarregando(true); carregar(); }, [carregar]);

  const atualizarStatus = async (v: Vistoria, novoStatus: 'REALIZADA' | 'CANCELADA') => {
    try {
      await api.patch(`/api/vistorias/${v.id}`, {
        status: novoStatus,
        ...(novoStatus === 'REALIZADA' && { dataRealizada: new Date().toISOString() }),
      });
      carregar();
    } catch { Alert.alert('Erro', 'Não foi possível atualizar a vistoria.'); }
  };

  const abrirOpcoes = (v: Vistoria) => {
    if (v.status !== 'AGENDADA') return;
    Alert.alert(
      'Atualizar Vistoria',
      `Vistoria agendada para ${formatDateTime(v.dataAgendada)}`,
      [
        { text: '✅ Marcar como Realizada', onPress: () => atualizarStatus(v, 'REALIZADA') },
        { text: '❌ Cancelar Vistoria', style: 'destructive', onPress: () => atualizarStatus(v, 'CANCELADA') },
        { text: 'Fechar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Vistorias</Text>
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTROS}
        keyExtractor={(i) => i.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtroRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filtroChip, statusFiltro === item.value && styles.filtroChipAtivo]}
            onPress={() => setStatusFiltro(item.value)}
          >
            <Text style={[styles.filtroText, statusFiltro === item.value && styles.filtroTextAtivo]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2D6A4F" size="large" />
      ) : (
        <FlatList
          data={vistorias}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#2D6A4F" />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma vistoria encontrada.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => abrirOpcoes(item)}
              activeOpacity={item.status === 'AGENDADA' ? 0.7 : 1}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardData}>{formatDateTime(item.dataAgendada)}</Text>
                <Badge label={STATUS_LABEL[item.status] ?? item.status} color={STATUS_COLOR[item.status] ?? '#6b7280'} />
              </View>
              <Text style={styles.fiscal}>👤 {item.fiscal.nome}</Text>
              {item.licenca && (
                <Text style={styles.licenca}>📄 {item.licenca.protocolo} · {item.licenca.requerente}</Text>
              )}
              {item.observacoes && <Text style={styles.obs}>{item.observacoes}</Text>}
              {item.status === 'AGENDADA' && (
                <Text style={styles.tapHint}>Toque para atualizar →</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  filtroRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#e5e7eb' },
  filtroChipAtivo: { backgroundColor: '#2D6A4F' },
  filtroText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filtroTextAtivo: { color: '#fff', fontWeight: '600' },
  lista: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardData: { fontSize: 14, fontWeight: '600', color: '#111827' },
  fiscal: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  licenca: { fontSize: 13, color: '#2D6A4F', marginBottom: 4 },
  obs: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontStyle: 'italic' },
  tapHint: { fontSize: 11, color: '#2D6A4F', marginTop: 8, textAlign: 'right', fontWeight: '500' },
});
