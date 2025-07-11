FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the port
EXPOSE 5001

# Run the application
CMD ["npm", "start"] 