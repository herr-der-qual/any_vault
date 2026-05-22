FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/dist /app

RUN touch index.html

EXPOSE 80

CMD ["tail", "-f", "/dev/null"]