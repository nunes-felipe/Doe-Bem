import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function labelMes(valor) {
  if (!valor) return '';
  const [, mes] = valor.split('-');
  return MESES[Math.max(0, Number(mes) - 1)] || valor;
}

export default function ImpactoMensalChart({ dados = [], titulo = 'Impacto mensal' }) {
  const maior = Math.max(...dados.map((item) => Number(item.alimentos || item.doacoes || 0)), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      {dados.length === 0 ? (
        <Text style={styles.vazio}>Sem entregas registradas nos ultimos meses.</Text>
      ) : (
        <View style={styles.grafico}>
          {dados.map((item) => {
            const valor = Number(item.alimentos || item.doacoes || 0);
            const altura = Math.max(10, Math.round((valor / maior) * 92));
            return (
              <View key={item.mes} style={styles.coluna}>
                <Text style={styles.valor}>{valor}</Text>
                <View style={[styles.barra, { height: altura }]} />
                <Text style={styles.mes}>{labelMes(item.mes)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  titulo: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 12 },
  vazio: { color: '#8A8A8A', fontSize: 13 },
  grafico: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  coluna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barra: {
    width: '70%',
    minWidth: 18,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  valor: { fontSize: 11, color: '#424242', marginBottom: 4, fontWeight: '600' },
  mes: { fontSize: 11, color: '#757575', marginTop: 6 },
});
