# Guía de Despliegue en Producción: MACHTIA Adaptive Tutor

Este documento detalla los pasos para desplegar **MACHTIA Adaptive Tutor** en entornos de producción (Vercel, AWS ECS/Fargate, Render, Fly.io, Railway o VPS), manteniendo desacoplados el **Frontend Next.js** y el **Servidor MCP**.

---

## 1. Despliegue del Frontend (Next.js 14)

El frontend de MACHTIA Adaptive Tutor es una aplicación Next.js 14 con App Router y componentes React 18.

### Plataformas recomendadas
- **Vercel** (despliegue en un clic)
- **AWS Amplify**
- **Docker / Cloud Run / ECS**

### Variables de Entorno Requeridas en el Frontend
Configurar las siguientes variables en el panel de control del proveedor de hosting:

| Variable | Descripción | Valor de Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_MCP_URL` | URL pública del endpoint Streamable HTTP del servidor MCP. **Evitar localhost en producción.** | `https://mcp.machtia.edu.mx/mcp` o `https://api.tu-dominio.com/mcp` |
| `NEXT_PUBLIC_JUDGE_DEMO` | Activa el modo evaluación para jurados (inicia en rol profesor, limpia datos al arrancar). | `true` |
| `JUDGE_DEMO` | Equivalente de servidor para modo evaluación. | `true` |
| `AI_PROVIDER` | Proveedor de razonamiento (`mock` para modo seguro autónomo, o `amazon` para Bedrock). | `mock` o `amazon` |

### Pasos de Despliegue en Vercel
1. Conectar el repositorio de GitHub en Vercel.
2. Asegurar que el Framework Preset esté configurado como **Next.js**.
3. En **Environment Variables**, agregar:
   - `NEXT_PUBLIC_MCP_URL=https://tu-mcp-server.onrender.com/mcp`
   - `NEXT_PUBLIC_JUDGE_DEMO=true`
4. Ejecutar el Deploy.
5. El frontend quedará accesible en una URL como: `https://machtia-tutor.vercel.app`.

---

## 2. Despliegue del Servidor MCP (Streamable HTTP Server)

El servidor MCP es un servicio Node.js independiente implementado bajo la especificación **Model Context Protocol (MCP 2025-11-25)** con transporte **Streamable HTTP**, endpoints JSON-RPC 2.0 y Server-Sent Events (SSE).

### Plataformas recomendadas
- **Render** (Web Service Node.js)
- **Railway / Fly.io**
- **AWS ECS / Fargate / App Runner**
- **VPS (Ubuntu 22.04 + PM2 + Nginx)**

### Variables de Entorno del Servidor MCP

| Variable | Descripción | Valor de Ejemplo |
|---|---|---|
| `MCP_PORT` | Puerto de escucha HTTP del servidor MCP. | `3100` (o `$PORT` asignado por Render/Cloud) |
| `MCP_ALLOWED_ORIGINS` | Orígenes CORS permitidos para llamadas desde el navegador. En producción debe coincidir con la URL del frontend. | `https://machtia-tutor.vercel.app` o `*` |
| `NODE_ENV` | Entorno de ejecución de Node.js. | `production` |

### Endpoints Expuestos por el Servidor MCP

1. **JSON-RPC 2.0 (Streamable HTTP):**
   - Ruta: `POST /mcp`
   - Headers requeridos: `Content-Type: application/json`, `x-mcp-protocol-version: 2025-11-25`
   - Métodos soportados: `initialize`, `ping`, `tools/list`, `tools/call`.

2. **Server-Sent Events (SSE Stream):**
   - Ruta: `GET /mcp` o `GET /sse`
   - Content-Type: `text/event-stream; charset=utf-8`
   - Envía eventos de endpoint, ready y pings de heartbeat cada 15 segundos.

3. **Health Check y Telemetría:**
   - Ruta: `GET /health` o `GET /healthz`
   - Respuesta JSON 200 OK:
     ```json
     {
       "status": "ok",
       "protocolVersion": "2025-11-25",
       "transport": "Streamable HTTP",
       "server": "machtia-tutor-mcp-server",
       "version": "1.0.0",
       "toolsCount": 7,
       "timestamp": "2026-09-28T10:00:00.000Z"
     }
     ```

### Comando de Arranque del Servidor en Producción
```bash
# Con tsx / Node.js
npx tsx mcp/server/index.ts
```
O compilado mediante TypeScript:
```bash
npm run mcp
```

### Ejemplo de Configuración Dockerfile para el Servidor MCP
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3100
ENV NODE_ENV=production
ENV MCP_PORT=3100
CMD ["npx", "tsx", "mcp/server/index.ts"]
```

---

## 3. Verificación del Despliegue en Vivo

Una vez desplegados ambos servicios, ejecutar el siguiente checklist de verificación:

1. **Probar el Health Check público:**
   ```bash
   curl -i https://tu-mcp-server.com/health
   ```
   Debe devolver HTTP `200 OK` con `"status": "ok"` y `"toolsCount": 7`.

2. **Probar el handshake initialize MCP:**
   ```bash
   curl -X POST https://tu-mcp-server.com/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25"}}'
   ```
   Debe devolver HTTP `200 OK` con la información del servidor `machtia-tutor-mcp-server`.

3. **Abrir el Frontend en el navegador:**
   - Observar el banner superior: debe mostrar la píldora verde **`MCP Connected`** con la latencia real en milisegundos.
   - En caso de que el servidor esté temporalmente inaccesible, el frontend conmuta automáticamente a **`MCP Offline • Modo Demo Activo`** sin interrumpir la experiencia pedagógica.
