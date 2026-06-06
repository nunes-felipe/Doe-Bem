import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, cadastrar as cadastrarApi } from '../services/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verifica se já existe sessão salva ao abrir o app
  useEffect(() => {
    async function carregarSessao() {
      const token = await AsyncStorage.getItem('@doebem:token');
      const usuarioSalvo = await AsyncStorage.getItem('@doebem:usuario');
      if (token && usuarioSalvo) {
        setUsuario(JSON.parse(usuarioSalvo));
      }
      setCarregando(false);
    }
    carregarSessao();
  }, []);

  async function entrar(email, senha) {
    const resposta = await loginApi({ email, senha });
    const { token, usuario } = resposta.data;
    await AsyncStorage.setItem('@doebem:token', token);
    await AsyncStorage.setItem('@doebem:usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  }

  async function cadastrar(dados) {
    const resposta = await cadastrarApi(dados);
    const { token, usuario } = resposta.data;
    await AsyncStorage.setItem('@doebem:token', token);
    await AsyncStorage.setItem('@doebem:usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  }

  async function sair() {
    await AsyncStorage.removeItem('@doebem:token');
    await AsyncStorage.removeItem('@doebem:usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, cadastrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
