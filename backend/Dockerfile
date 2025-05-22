# Use Node.js LTS as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose the port (assuming default Express port is 3001, adjust if needed)
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
