# ---------- Base ----------
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------- Development ----------
FROM base AS dev
RUN npm install
COPY . .
ENV NODE_ENV=development
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- Production ----------
FROM base AS prod
RUN npm install --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
