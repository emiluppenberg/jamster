# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=24.12.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# The Docker build context is the repository root. The MCP app depends on the
# sibling ../shared package via file:../shared.
WORKDIR /app/jamstermcp

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY shared /app/shared
COPY jamstermcp/package-lock.json jamstermcp/package.json ./
WORKDIR /app/shared
RUN npm ci --omit=dev
WORKDIR /app/jamstermcp
RUN npm ci --include=dev

# Copy application code
COPY jamstermcp .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev
WORKDIR /app/shared
RUN npm prune --omit=dev
WORKDIR /app/jamstermcp


# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "dist/jamstermcp/src/index.js" ]
