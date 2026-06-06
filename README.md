# DoeBem

Aplicativo mobile de doacao de alimentos que conecta doadores, voluntarios e ONGs.

## Stack

- Frontend: React Native + Expo SDK 54
- Backend: Node.js + Express
- Banco: PostgreSQL/Supabase
- Auth: JWT
- Recursos mobile: geolocalizacao, mapa, camera, QR Code, notificacoes e upload de fotos

## Como rodar

As variaveis de ambiente devem ser configuradas somente localmente. Arquivos `.env` nao fazem parte do repositorio.

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Abra o Expo Go e use a URL/QR Code exibido pelo Expo.

## Features implementadas

- Login e cadastro por tipo de usuario
- Priorizacao de doacoes por urgencia e distancia
- Foto e geolocalizacao na criacao da doacao
- Upload de fotos via backend
- Lista de doacoes disponiveis e lista de doacoes relacionadas ao usuario
- Aceite de coleta por voluntario
- Mapa com marcador e botao para abrir rota no Google Maps
- Confirmacao de entrega por QR Code da ONG
- Dashboard exclusivo da ONG com QR de recebimento
- Grafico de impacto mensal
- Notificacoes in-app e registro de push token
- Cancelamento de doacao pelo doador
- Testes unitarios do backend
