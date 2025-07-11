FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Install serve to run the application
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Run the application
CMD ["serve", "-s", "build", "-l", "3000"] 