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

# Build the Next.js application
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
