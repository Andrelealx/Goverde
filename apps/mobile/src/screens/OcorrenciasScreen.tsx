import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import Badge from '../components/Badge';
import { formatDate, statusOcorrenciaLabel, statusOcorrenciaColor, categoriaLabel, prioridadeColor } from '../utils/formatters';

interface Ocorrencia {
  id: string;
  protocolo: string;
  titulo: string;
  categoria: string;
  status: string;
  prioridade: string;
  bairro: string | null;
  criadoEm: string;
  fiscalResponsavel: { nome: string } | null;
}

const STATUS_FILTROS = [
  { label: 'Todas', value: '' },
  { label: 'Aberta', value: 'ABERTA' },
  { label: 'Em Análise', value: 'EM_ANALISE' },
  { label: 'Em Campo', value: 'EM_CAMPO' },
  { label: 'Resolvida', value: 'RESOLVIDA' },
];

export default function OcorrenciasScreen() {
  const navigation = useNavigation<any>();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const params = statusFiltro ? { status: statusFiltro } : {};
      const { data } = await api.get('/api/ocorrencias', { params });
      setOcorrencias(data.data ?? data);
    } catch {}
    finally { setCarregando(false); setRefreshing(false); }
  }, [statusFiltro]);

  useEffect(() => { setCarregando(true); carregar(); }, [carregar]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ocorrências</Text>
        <TouchableOpacity style={styles.novaBtn} onPress={() => navigation.navigate('NovaOcorrencia')}>
          <Text style={styles.novaBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
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
            <Text style={[styles.filtroText, statusFiltro === item.value && styles.filtroTextAtivo]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2D6A4F" size="large" />
      ) : (
        <FlatList
          data={ocorrencias}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#2D6A4F" />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhuma ocorrência encontrada.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.protocolo}>{item.protocolo}</Text>
                <Badge label={statusOcorrenciaLabel[item.status] ?? item.status} color={statusOcorrenciaColor[item.status] ?? '#6b7280'} />
              </View>
              <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{categoriaLabel[item.categoria] ?? item.categoria}</Text>
                <View style={styles.dot} />
                <Text style={[styles.cardMeta, { color: prioridadeColor[item.prioridade] }]}>{item.prioridade}</Text>
                <View style={styles.dot} />
                <Text style={styles.cardMeta}>{formatDate(item.criadoEm)}</Text>
              </View>
              {item.bairro && <Text style={styles.bairro}>📍 {item.bairro}</Text>}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  novaBtn: { backgroundColor: '#2D6A4F', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  novaBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filtroRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  filtroChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#e5e7eb' },
  filtroChipAtivo: { backgroundColor: '#2D6A4F' },
  filtroText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filtroTextAtivo: { color: '#fff', fontWeight: '600' },
  lista: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 48, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  protocolo: { fontSize: 12, color: '#2D6A4F', fontWeight: '700', fontVariant: ['tabular-nums'] },
  cardTitulo: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 10, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  cardMeta: { fontSize: 12, color: '#6b7280' },
  dot: { width: 3, height: 3, backgroundColor: '#d1d5db', borderRadius: 99 },
  bairro: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
});
