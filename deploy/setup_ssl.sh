#!/bin/bash

# Install Certbot if not present
if ! command -v certbot &> /dev/null; then
  apt-get update && apt-get install -y certbot
fi

# Stop nginx to free up port 80
if docker ps | grep nginx; then
  docker-compose down nginx
fi

# Obtain certificates for all domains
certbot certonly --standalone \
  --agree-tos \
  --email kiran@ibcm.app \
  -d www.ibcm.app \
  -d api.ibcm.app \
  -d admin.ibcm.app \
  --non-interactive

# Copy certificates to nginx ssl directory
mkdir -p ./nginx/ssl/live
cp -r /etc/letsencrypt/live ./nginx/ssl/

# Restart nginx

docker-compose up -d nginx 