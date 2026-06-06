import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import CadastroScreen from '../screens/CadastroScreen';
import HomeScreen from '../screens/HomeScreen';
import NovaDoacaoScreen from '../screens/NovaDoacaoScreen';
import DoacoesScreen from '../screens/DoacoesScreen';
import DoacaoDetalheScreen from '../screens/DoacaoDetalheScreen';
import OngDashboardScreen from '../screens/OngDashboardScreen';
import NotificacoesScreen from '../screens/NotificacoesScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, color }) {
  return <Text style={{ fontSize: 13, fontWeight: '800', color }}>{label}</Text>;
}

function TabsAutenticado() {
  const { usuario } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#8A8A8A',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon label="I" color={color} /> }}
      />
      <Tab.Screen
        name="Doacoes"
        component={DoacoesScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon label="D" color={color} /> }}
      />
      {usuario?.tipo === 'doador' && (
        <Tab.Screen
          name="Nova Doacao"
          component={NovaDoacaoScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon label="+" color={color} /> }}
        />
      )}
      {usuario?.tipo === 'ong' && (
        <Tab.Screen
          name="ONG"
          component={OngDashboardScreen}
          options={{ tabBarIcon: ({ color }) => <TabIcon label="O" color={color} /> }}
        />
      )}
      <Tab.Screen
        name="Alertas"
        component={NotificacoesScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon label="!" color={color} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon label="P" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name="App" component={TabsAutenticado} />
            <Stack.Screen name="DetalheDoacao" component={DoacaoDetalheScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
