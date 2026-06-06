# DoeBem

Aplicativo mobile de doacao de alimentos que conecta doadores, voluntarios e ONGs.

## Stack

- Frontend: React Native + Expo SDK 54
- Backend: Node.js + Express
- Banco: PostgreSQL/Supabase
- Auth: JWT
- Recursos mobile: geolocalizacao, mapa, camera, QR Code, notificacoes e upload de fotos

## Como rodar

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

O backend sobe em `http://localhost:3000`. Para usar no celular, configure `PUBLIC_API_URL` e `frontend/.env` com o IP local da maquina, por exemplo `http://192.168.3.213:3000`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm start
```

Abra o Expo Go e use a URL/QR Code do Expo.

## Features implementadas

- Login e cadastro por tipo de usuario
- Priorizacao de doacoes por urgencia e distancia
- Foto e geolocalizacao na criacao da doacao
- Upload de fotos via backend, com suporte a Supabase Storage quando credenciais forem configuradas
- Lista de doacoes disponiveis e lista de doacoes relacionadas ao usuario
- Aceite de coleta por voluntario
- Mapa com marcador e botao para abrir rota no Google Maps
- Confirmacao de entrega por QR Code da ONG
- Dashboard exclusivo da ONG com QR de recebimento
- Grafico de impacto mensal
- Notificacoes in-app e push token Expo
- Cancelamento de doacao pelo doador

## Upload em nuvem

Para usar Supabase Storage de verdade, configure no `backend/.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_STORAGE_BUCKET=doebem
```

Sem essas variaveis, o app continua funcionando com storage local em `backend/uploads`.
