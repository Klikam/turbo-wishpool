# Build from the repo root so the pnpm workspace is visible:
#   fly deploy --config apps/backend/fly.toml --dockerfile apps/backend/Dockerfile
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter backend...
RUN pnpm --filter backend build

FROM base AS runtime
ENV NODE_ENV=production
COPY . .
RUN pnpm install --frozen-lockfile --prod --filter backend...
COPY --from=build /repo/apps/backend/dist apps/backend/dist
WORKDIR /repo/apps/backend
EXPOSE 3001
CMD ["node", "dist/main"]
