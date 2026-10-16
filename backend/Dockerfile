FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM build AS prod-deps
RUN pnpm prune --prod

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm \
          /usr/local/bin/npm /usr/local/bin/npx \
          /opt/yarn-v1.22.22 /usr/local/bin/yarn /usr/local/bin/yarnpkg \
          /usr/local/lib/node_modules/corepack /usr/local/bin/corepack
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
USER node
EXPOSE 9090
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node", "dist/main.js"]
