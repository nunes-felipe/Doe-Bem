import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { registrarPushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId
  );
}

export async function configurarNotificacoesPush() {
  try {
    if (!Device.isDevice) {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const permissoesAtuais = await Notifications.getPermissionsAsync();
    let status = permissoesAtuais.status;

    if (status !== 'granted') {
      const solicitadas = await Notifications.requestPermissionsAsync();
      status = solicitadas.status;
    }

    if (status !== 'granted') {
      return null;
    }

    const projectId = getProjectId();
    const token = projectId
      ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
      : (await Notifications.getExpoPushTokenAsync()).data;

    await registrarPushToken(token);
    return token;
  } catch (err) {
    console.log('Notificacoes push indisponiveis neste ambiente:', err.message);
    return null;
  }
}
