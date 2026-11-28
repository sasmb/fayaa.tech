# Marketing site for fayaa.tech, served by nginx on Fly.
# Build from the repo root, because the site imports copy, clips and design
# tokens from ../src:
#   fly deploy --config site/fly.toml --remote-only

FROM node:24-alpine AS build
WORKDIR /repo/site
COPY site/package.json site/package-lock.json ./
RUN npm ci
COPY src /repo/src
COPY site /repo/site
ARG PUBLIC_SITE_URL=https://fayaa.tech
ARG PUBLIC_APP_URL=https://app.fayaa.tech
ARG PUBLIC_API_URL=https://fayaa-studio-server.fly.dev
ARG PUBLIC_PLAUSIBLE_DOMAIN=
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL PUBLIC_APP_URL=$PUBLIC_APP_URL \
    PUBLIC_API_URL=$PUBLIC_API_URL PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN
RUN npm run build

FROM nginx:1.27-alpine
COPY site/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/site/dist /usr/share/nginx/html
EXPOSE 8080
