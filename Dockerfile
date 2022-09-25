# Build frontend
FROM node:18-alpine as frontend
RUN npm config set update-notifier false && npm config set fund false
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
WORKDIR /app
COPY web/frontend .
RUN npm ci --legacy-peer-deps && npm run build

# Build Backend
FROM node:18-alpine as backend
RUN npm config set update-notifier false && npm config set fund false
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
WORKDIR /app
COPY web/package*.json ./
COPY web/tsconfig.json ./
COPY web/src ./src
RUN npm ci && npm run build

# Build the actual server for deployment
FROM node:18-alpine as server
RUN npm config set update-notifier false && npm config set fund false
ARG SHOPIFY_API_KEY
ENV SHOPIFY_API_KEY=${SHOPIFY_API_KEY}
WORKDIR /workspace
COPY web/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend /app/dist ./dist
COPY --from=frontend /app/dist ./frontend/dist

EXPOSE 8080
# Just stop talking
CMD [ "npm", "start", "--no-update-notifier", "--quiet" ]
