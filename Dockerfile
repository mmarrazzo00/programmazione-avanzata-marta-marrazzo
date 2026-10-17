
# Immagine Node.js
FROM node:22-alpine

# Directory di lavoro nel container
WORKDIR /app

# Copia i file delle dipendenze
COPY package.json package-lock.json ./

# Installa le dipendenze
RUN npm ci

# Copia la configurazione TypeScript
COPY tsconfig.json ./

# Copia il codice sorgente
COPY src ./src

# Compila TypeScript in JavaScript
RUN npm run build

# Configurazione ambiente
ENV NODE_ENV=production

# Porta del backend
EXPOSE 3000

# Avvio del server Express
CMD ["npm", "start"]
