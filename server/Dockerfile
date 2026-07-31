# Use node:20-bookworm-slim because Prisma requires OpenSSL and glibc
FROM node:20-bookworm-slim AS builder

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for Prisma)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# --- Runner Stage ---
# We use a second stage to keep the final image size small
FROM node:20-bookworm-slim AS runner

# Install OpenSSL in the runner as well
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Set environment variable to production
ENV NODE_ENV=production

# Copy built node_modules and Prisma client from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

# Expose the port the app runs on
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
