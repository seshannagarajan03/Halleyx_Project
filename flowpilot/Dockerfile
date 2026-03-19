# Use Node.js as the base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --production

# Copy backend code
COPY backend ./backend/

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "backend/server.js"]
