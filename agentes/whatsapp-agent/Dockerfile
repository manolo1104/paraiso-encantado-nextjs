# Imagen para correr el bot de WhatsApp (Camila) en Railway.
# whatsapp-web.js usa un navegador headless (Chromium) vía Puppeteer.
FROM node:20-slim

# Chromium del sistema + fuentes/CA. apt resuelve solo las librerías que Chromium necesita.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    tini \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer NO descarga su propio Chromium: usamos el del sistema.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    TZ=America/Mexico_City

WORKDIR /app

# Instala dependencias primero (mejor caché de build)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copia el resto del código del bot
COPY . .

# Puerto de la página de estado/QR (Railway inyecta la variable PORT)
EXPOSE 3001

# `tini` como proceso nº 1: recoge los procesos hijos de Chromium que mueren.
# Node no lo hace, y en Camila de Kora los «zombis» llenaron el tope de 1.000
# procesos del contenedor (21 sep 2026). Railway pisa este ENTRYPOINT con el
# `startCommand` de railway.json, por eso allí también dice `/usr/bin/tini --`.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
