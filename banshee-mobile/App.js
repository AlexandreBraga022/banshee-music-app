import React, { useState } from 'react';
import Constants from 'expo-constants';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator,
  StyleSheet, Platform, KeyboardAvoidingView, StatusBar, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Tenta capturar dinamicamente o IP de desenvolvimento do Expo
let HOST = '127.0.0.1'; // Padrão

if (Constants?.expoConfig?.hostUri) {
  // O Expo retorna. O split separa o IP da porta.
  HOST = Constants.expoConfig.hostUri.split(':')[0];
} else if (Platform.OS === 'android') {
  HOST = '10.0.2.2'; // Emulador Android
}

const API_URL = `http://${HOST}:8000/api/artist/search`;

// ====== TEMAS ======
const dark = {
  bg: ['#081d20', '#0a3f4c', '#097186'],
  card: 'rgba(8, 43, 46, 0.55)',
  cardBorder: 'rgba(34, 211, 238, 0.22)',
  text: '#f1f5f9',
  muted: '#94a3b8',
  accent: '#22d3ee',
  chip: 'rgba(34, 211, 238, 0.12)',
  input: 'rgba(2, 29, 31, 0.6)',
  btn: ['#22d3ee', '#3a989a', '#1dd8c5'],
  bar: 'light-content',
};
const light = {
  bg: ['#f4fcfc', '#bfc0c1', '#c1faf7'],
  card: '#ffffff',
  cardBorder: 'rgba(2, 117, 199, 0.25)',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#00302f',
  chip: '#e0f2fe',
  input: '#ffffff',
  btn: ['#006073', '#00689c', '#166976'],
  bar: 'dark-content',
};

const SUGGESTIONS = ['Linkin Park', 'Victor Borba', 'Imagine Dragons', 'Alok'];

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const t = isDark ? dark : light;

  async function search(name) {
    const artist = (name ?? query).trim();
    if (artist.length < 2) {
      setError('Digite pelo menos 2 caracteres.');
      return;
    }
    setQuery(artist);
    setError('');
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist_name: artist }),
      });
      const body = await res.json();
      if (res.ok) setData(body);
      else setError(body.detail || 'Não foi possível obter os dados do artista.');
    } catch (e) {
      setError(`Não foi possível conectar ao servidor em ${API_URL}. Verifique se o Uvicorn está rodando com --host 0.0.0.0.`);
    } finally {
      setLoading(false);
    }
  }

  const card = { backgroundColor: t.card, borderColor: t.cardBorder };

  return (
    <LinearGradient colors={t.bg} style={s.flex}>
      <StatusBar barStyle={t.bar} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Cabeçalho */}
          <View style={s.header}>
            <View style={s.brand}>
              <LinearGradient colors={t.btn} style={s.logo}>
                <Text style={s.logoTxt}>B</Text>
              </LinearGradient>
              <View>
                <Text style={[s.brandName, { color: t.accent }]}>BANSHEE</Text>
                <Text style={[s.brandSub, { color: t.muted }]}>Music Intelligence</Text>
              </View>
            </View>
            <View style={s.themeRow}>
              <Text style={{ fontSize: 16 }}>{isDark ? '🌙' : '☀️'}</Text>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ true: '#0ea5e9', false: '#94a3b8' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Hero + busca */}
          <Text style={[s.title, { color: t.text }]}>Descubra tudo sobre seus artistas favoritos</Text>
          <Text style={[s.desc, { color: t.muted }]}>
            Biografia, álbuns e maiores sucessos pesquisados na web via Gemini AI.
          </Text>

          <View style={[s.searchBox, card]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => search()}
              placeholder="Ex: Linkin Park, Victor Borba"
              placeholderTextColor={t.muted}
              returnKeyType="search"
              style={[s.input, { color: t.text, backgroundColor: t.input }]}
            />
            <TouchableOpacity activeOpacity={0.85} onPress={() => search()} disabled={loading}>
              <LinearGradient colors={t.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
                <Text style={s.btnTxt}>Pesquisar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={s.chips}>
            {SUGGESTIONS.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => search(n)}
                style={[s.chip, { backgroundColor: t.chip, borderColor: t.cardBorder }]}
              >
                <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Erro */}
          {!!error && (
            <View style={s.error}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          {/* Carregando */}
          {loading && (
            <View style={s.loading}>
              <ActivityIndicator size="large" color={t.accent} />
              <Text style={[s.loadTitle, { color: t.accent }]}>Pesquisando Google, YouTube & Spotify...</Text>
              <Text style={{ color: t.muted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
                Buscando faixas reais, biografia e estatísticas.
              </Text>
            </View>
          )}

          {/* Resultados */}
          {data && !loading && (
            <View>
              <View style={[s.panel, card, { borderLeftWidth: 5, borderLeftColor: t.accent }]}>
                <Text style={[s.artist, { color: t.text }]}>{data.artist_name}</Text>
                <Text style={{ color: t.muted, marginTop: 4 }}>{data.real_name_or_origin}</Text>
                <View style={s.chips}>
                  {(data.genres || []).map((g) => (
                    <View key={g} style={[s.chip, { backgroundColor: t.chip, borderColor: t.cardBorder }]}>
                      <Text style={{ color: t.accent, fontWeight: '700', fontSize: 12 }}>{g}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={s.grid}>
                {(data.metrics || []).map((m) => (
                  <View key={m.label} style={[s.metric, card]}>
                    <Text style={[s.metricLabel, { color: t.muted }]}>{m.label}</Text>
                    <Text style={[s.metricValue, { color: t.text }]}>{m.value}</Text>
                    <Text style={{ color: t.accent, fontWeight: '700', fontSize: 12 }}>📈 {m.highlight}</Text>
                  </View>
                ))}
              </View>

              <View style={[s.panel, card]}>
                <Text style={[s.panelTitle, { color: t.text }]}>📖 Biografia</Text>
                <Text style={[s.body, { color: t.text }]}>{data.biography_summary}</Text>
                <View style={[s.analysis, { backgroundColor: t.chip, borderColor: t.cardBorder }]}>
                  <Text style={{ color: t.accent, fontWeight: '800', marginBottom: 4 }}>🎙️ Sonoridade e estilo</Text>
                  <Text style={{ color: t.muted, lineHeight: 20 }}>{data.musical_style_analysis}</Text>
                </View>
              </View>

              <View style={[s.panel, card]}>
                <Text style={[s.panelTitle, { color: t.text }]}>🔥 Músicas em alta</Text>
                {(data.top_tracks || []).map((tr, i) => (
                  <View key={`${tr.title}-${i}`} style={[s.track, { borderColor: t.cardBorder }]}>
                    <LinearGradient colors={t.btn} style={s.trackNum}>
                      <Text style={{ color: '#fff', fontWeight: '800' }}>{i + 1}</Text>
                    </LinearGradient>
                    <View style={s.flex}>
                      <Text style={{ color: t.text, fontWeight: '700' }}>{tr.title}</Text>
                      <Text style={{ color: t.muted, fontSize: 12 }}>{tr.album} ({tr.year})</Text>
                    </View>
                    <Text style={{ color: t.accent, fontWeight: '800', fontSize: 12 }}>{tr.popularity_score} pts</Text>
                  </View>
                ))}
              </View>

              {!!(data.similar_artists || []).length && (
                <View style={[s.panel, card]}>
                  <Text style={[s.panelTitle, { color: t.text }]}>🎧 Artistas similares</Text>
                  <View style={s.chips}>
                    {data.similar_artists.map((a) => (
                      <TouchableOpacity
                        key={a}
                        onPress={() => search(a)}
                        style={[s.chip, { backgroundColor: t.chip, borderColor: t.cardBorder }]}
                      >
                        <Text style={{ color: t.accent, fontWeight: '700', fontSize: 13 }}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { fontSize: 20, color: '#fff' },
  brandName: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  brandSub: { fontSize: 11, letterSpacing: 1 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontSize: 30, fontWeight: '800', lineHeight: 36, marginBottom: 10 },
  desc: { fontSize: 15, lineHeight: 22, marginBottom: 22 },
  searchBox: { borderWidth: 1, borderRadius: 18, padding: 8, gap: 8 },
  input: { fontSize: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  error: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: '#f87171', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 20 },
  errorTxt: { color: '#fca5a5', lineHeight: 20 },
  loading: { alignItems: 'center', paddingVertical: 40 },
  loadTitle: { fontWeight: '700', fontSize: 15, marginTop: 14, textAlign: 'center' },
  panel: { borderWidth: 1, borderRadius: 20, padding: 20, marginTop: 18 },
  artist: { fontSize: 28, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  metric: { borderWidth: 1, borderRadius: 16, padding: 16, width: '48%', flexGrow: 1 },
  metricLabel: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  metricValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  panelTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
  analysis: { borderWidth: 1, borderRadius: 14, padding: 14 },
  track: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10 },
  trackNum: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});