# Base image
FROM node:18-alpine3.17 AS base
ARG NPM_TOKEN="unavailable"
ENV NPM_TOKEN=$NPM_TOKEN
ARG COMMIT="unavailable"
ENV COMMIT=$COMMIT
RUN mkdir /app && chown node:node /app
WORKDIR /app
COPY package*json .npmrc ./

# Builder and dependencies intermediate stage
FROM base AS base_dependencies
RUN npm set progress=false && npm config set depth 0
# Disable husky hooks while installing dependencies - Needs node 16
RUN npm pkg delete scripts.prepare
#RUN apk add git

# Application builder
FROM base_dependencies AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production dependencies
FROM base_dependencies AS production_dependencies
RUN npm ci --omit=dev

# Production execution stage
FROM base AS production

RUN apk add --no-cache tini

COPY --from=builder /app/dist ./
COPY --from=production_dependencies /app/node_modules ./node_modules
COPY .env.example ./.env
COPY newrelic.js ./

RUN date -u "+%Y-%m-%d %H:%M:%S" > ./build-date.txt
RUN echo $COMMIT > ./commit-hash.txt

USER node
EXPOSE 8000

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "src/main.js" ]