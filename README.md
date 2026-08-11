# Flick

Flick is a full-stack, real-time one-to-one messaging application. It uses OTP-based sign-in, live Socket.IO updates, unread-message tracking, typing and presence indicators, and optional image messages stored in Cloudinary.

The application is split into independently runnable services:

```text
Next.js client --> User service --> Redis (OTP storage and rate limiting)
       |                |
       |                +--> RabbitMQ --> Mail service --> SMTP
       |
       +---------------> Chat service --> MongoDB / Cloudinary
                           |
                           +--> Socket.IO (messages, presence, typing)
```

## Features

- Account registration with hashed passwords
- Password-validated, email OTP login
- OTP expiry (five minutes) and per-email request throttling
- JWT/cookie-protected user and chat APIs
- One-to-one chat creation and chat history
- Real-time messages, online/offline presence, typing indicators, and sidebar updates
- Per-chat unread-message counts and read status
- Image attachments via Cloudinary (JPEG, PNG, GIF, or WebP; up to 5 MB)

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Redux Toolkit, React Query, Socket.IO Client |
| User service | Express 5, MongoDB/Mongoose, Redis, RabbitMQ, JWT, Zod |
| Chat service | Express 5, MongoDB/Mongoose, Socket.IO, Cloudinary, Multer |
| Mail service | Express 5, RabbitMQ, Nodemailer |

## Prerequisites

- Node.js 20 or newer
- MongoDB
- Redis
- RabbitMQ
- A Cloudinary account for image uploads
- SMTP credentials for sending OTP messages

## Installation

Install dependencies in every runnable package:

```bash
cd frontend && npm install
cd ../backend/user && npm install
cd ../chat && npm install
cd ../mail && npm install
```

> The repository root and `backend/` directories do not currently define workspace scripts; run commands from each service directory.

## Configuration

Create a `.env` file in each directory below. Never commit these files.

### `backend/user/.env`

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017
REDIS_URI=redis://127.0.0.1:6379
RABBITMQ_URL=amqp://localhost
JWT_SECRET=replace-with-a-long-random-secret
```

### `backend/chat/.env`

```env
PORT=5001
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017
USER_SERVICE_URL=http://localhost:5000/api/v1
JWT_SECRET=use-the-same-secret-as-the-user-service
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### `backend/mail/.env`

```env
PORT=5002
RABBITMQ_URL=amqp://localhost
USER=your-smtp-username
PASSWORD=your-smtp-password-or-app-password
```

The mail consumer is configured for Gmail's SMTP host on port 465. Use a Gmail app password or adapt `backend/mail/src/consumer.ts` for a different provider.

### `frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL_USER_SERVICE=http://localhost:5000/api/v1
NEXT_PUBLIC_BACKEND_URL_CHAT_SERVICE=http://localhost:5001/api/v1
```

The current socket client constructs a secure WebSocket (`wss://`) URL. For local development, serve the chat service over HTTPS or adjust the socket URL logic in `frontend/src/app/context/SocketContext.tsx` to use `ws://` locally.

## Run locally

Start the backing services (MongoDB, Redis, and RabbitMQ), then open four terminals:

```bash
# Terminal 1
cd backend/user
npm run dev

# Terminal 2
cd backend/chat
npm run dev

# Terminal 3
cd backend/mail
npm run dev

# Terminal 4
cd frontend
npm run dev
```

Open `http://localhost:3000`. The home route redirects to `/chat`; unauthenticated visitors are directed through the login flow.

## API overview

All endpoints below are prefixed with `/api/v1`.

### User service

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register` | Create a user |
| `POST` | `/request-otp` | Validate credentials and queue a login OTP email |
| `POST` | `/verify-otp` | Verify OTP and establish an authenticated session |
| `PUT` | `/update-password` | Change the authenticated user's password |
| `POST` | `/logout` | End the authenticated session |
| `GET` | `/me` | Retrieve the authenticated profile |
| `GET` | `/user/all` | List users |
| `GET` | `/user/:id` | Retrieve a user by ID |

### Chat service

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/chat/new` | Create or retrieve a one-to-one chat |
| `GET` | `/chat/all` | List the authenticated user's chats |
| `POST` | `/message` | Send a text or image message (`image` multipart field) |
| `GET` | `/message/:chatId` | Fetch messages and mark received messages as seen |

Protected endpoints accept the JWT in the `Authorization: Bearer <token>` header; the application also uses an `accessToken` cookie.

## Realtime events

The chat service exposes Socket.IO for authenticated clients. It emits `newMessage`, `chatUpdated`, `onlineUsers`, `user-online`, `user-offline`, and `userTyping`. Clients join a chat with `joinRoom`, leave it with `leaveRoom`, and send typing state with `typing`.

## Project structure

```text
frontend/              Next.js web client
backend/user/          Authentication, profiles, OTP producer
backend/chat/          Chat/message API, uploads, Socket.IO server
backend/mail/          RabbitMQ consumer that sends OTP email
```

## Available scripts

Run these inside `frontend`, `backend/user`, `backend/chat`, or `backend/mail` as applicable:

```bash
npm run dev      # TypeScript watch + Nodemon for backend; Next.js dev server for frontend
npm run build    # Compile TypeScript or build Next.js
npm start        # Run compiled backend or production Next.js server
```

The frontend also provides:

```bash
npm run lint
```

## Security notes

- Use strong, unique secrets in production and never expose `.env` files.
- Configure HTTPS and a secure frontend origin before deploying, since authentication cookies use `Secure` and `SameSite=None`.
- Restrict CORS to the deployed frontend URL and use managed credentials for MongoDB, Redis, RabbitMQ, Cloudinary, and SMTP.

## License

No license is currently specified. Add a license file before distributing or accepting external contributions.
