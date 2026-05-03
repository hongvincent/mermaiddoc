FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application source
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

EXPOSE 3000

# Run as non-root user
USER node

CMD ["node", "server.js"]
