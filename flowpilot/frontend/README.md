# FlowPilot Frontend

React + Vite dashboard for the FlowPilot workflow automation platform.

## Commands
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Environment
Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Required values:
- `VITE_API_URL` – backend REST API base URL
- `VITE_SOCKET_URL` – backend Socket.io base URL

## Pages
- Login
- Workflow Library
- Workflow Editor
- Execution Dashboard
- Audit Logs
