import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DonationMap({ description, style }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Mapa disponivel no app mobile</Text>
      <Text style={styles.text}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: { color: '#2E7D32', fontWeight: '700', marginBottom: 6 },
  text: { color: '#424242', textAlign: 'center', fontSize: 13 },
});
