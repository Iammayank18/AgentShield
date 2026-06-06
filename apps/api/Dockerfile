FROM node:22-alpine AS base
RUN npm i -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/security-runtime/package.json packages/security-runtime/
COPY packages/policy-engine/package.json packages/policy-engine/
COPY packages/tool-registry/package.json packages/tool-registry/
COPY packages/agent-core/package.json packages/agent-core/
COPY packages/observability/package.json packages/observability/
COPY packages/attack-simulator/package.json packages/attack-simulator/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages ./packages
COPY turbo.json package.json pnpm-workspace.yaml tsconfig.base.json ./
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main"]