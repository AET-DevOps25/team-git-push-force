# ---------- 1. BUILD STAGE ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Define build arguments
ARG BUILD_ENV=production

# speed up rebuilds: first copy lock files only
COPY package*.json ./
RUN npm ci --ignore-scripts

# now copy sources and build for specified environment
COPY . .
RUN npm run build -- --configuration=${BUILD_ENV}

# ---------- 2. RUNTIME STAGE ----------
FROM nginx:1.27-alpine
COPY --from=builder /app/dist/concepter/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost:80/ || exit 1
CMD ["nginx","-g","daemon off;"]
