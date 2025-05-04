FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy application code
COPY . .

# Environment setup - defaults that can be overridden during container runtime
ENV NODE_ENV=production
ENV PORT=5000
ENV CLIENT_URL=http://localhost:5173

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["yarn", "start"]