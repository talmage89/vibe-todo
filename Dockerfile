FROM oven/bun:alpine AS build
WORKDIR /app

# Prisma fails to build without DB_URL set
ENV DB_URL="prisma-db-url-stub"

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile \
  && apk add --no-cache ca-certificates
COPY . ./
RUN bun run build

FROM oven/bun:distroless AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build /app/dist ./dist

EXPOSE 8080
ENTRYPOINT ["bun"]
CMD ["dist/server/entry-server.js"]
