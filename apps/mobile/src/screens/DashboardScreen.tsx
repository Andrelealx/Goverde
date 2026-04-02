import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/auth.store';
import api from '../services/api';
import KpiCard from '../components/KpiCard';
import LoadingScreen from '../components/LoadingScreen';

interface Resumo {
  totalOcorrencias: number;
  ocorrenciasAbertas: number;
  ocorrenciasResolvidas: number;
  totalLicencas: number;
  licencasVencendo: number;
  totalVistorias: number;
  vistoriasPendentes: number;
}

export default function DashboardScreen() {
  const { usuario, logout } = useAuthStore();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get<Resumo>('/api/dashboard/resumo');
      setResumo(data);
    } catch {}
    finally { setCarregando(false); setRefreshing(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return <LoadingScreen />;

  const taxaResolucao = resumo?.totalOcorrencias
    ? Math.round((resumo.ocorrenciasResolvidas / resumo.totalOcorrencias) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#2D6A4F" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {usuario?.nome?.split(' ')[0]} 👋</Text>
            <Text style={styles.tenant}>{usuario?.tenant?.nome}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Taxa de resolução */}
        <View style={styles.taxaCard}>
          <View style={styles.taxaHeader}>
            <Text style={styles.taxaLabel}>Taxa de Resolução</Text>
            <Text style={styles.taxaValue}>{taxaResolucao}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${taxaResolucao}%` }]} />
          </View>
          <View style={styles.taxaRow}>
            <Text style={styles.taxaSub}>{resumo?.ocorrenciasResolvidas} resolvidas</Text>
            <Text style={styles.taxaSub}>{resumo?.totalOcorrencias} total</Text>
          </View>
        </View>

        {/* KPIs grid */}
        <Text style={styles.sectionTitle}>Resumo Geral</Text>
        <View style={styles.row}>
          <KpiCard label="Abertas" value={resumo?.ocorrenciasAbertas ?? 0} sub="ocorrências" color="#dc2626" />
          <KpiCard label="Resolvidas" value={resumo?.ocorrenciasResolvidas ?? 0} sub="total" color="#2D6A4F" />
        </View>
        <View style={styles.row}>
          <KpiCard label="Licenças Vencendo" value={resumo?.licencasVencendo ?? 0} sub="próx. 30 dias" color="#d97706" />
          <KpiCard label="Vistorias Pendentes" value={resumo?.vistoriasPendentes ?? 0} sub="agendadas" color="#2563eb" />
        </View>

        <Text style={styles.papel}>Você está logado como {usuario?.papel}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#111827' },
  tenant: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  taxaCard: { backgroundColor: '#2D6A4F', borderRadius: 16, padding: 20, marginBottom: 24 },
  taxaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taxaLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  taxaValue: { color: '#fff', fontSize: 28, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  taxaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  taxaSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', marginBottom: 4 },
  papel: { textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 16 },
});
