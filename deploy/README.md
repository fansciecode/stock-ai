# IBCM Stack Deployment on GCP

## Prerequisites
- GCP VM (Ubuntu recommended)
- Docker & Docker Compose installed
- DNS records for www.ibcm.app, api.ibcm.app, admin.ibcm.app pointing to your VM

## Steps

1. **Clone the repo and enter the directory:**
   ```sh
   git clone <repo-url>
   cd IBCM-stack
   ```

2. **Build and start all services (first time, without SSL):**
   ```sh
   docker-compose up -d
   ```

3. **Obtain SSL certificates:**
   ```sh
   cd deploy
   sudo bash setup_ssl.sh
   ```

4. **Restart services with SSL:**
   ```sh
   cd ..
   docker-compose up -d
   ```

## Scaling for Production
- For millions of requests, use GCP managed services (Cloud Run, GKE) and managed MongoDB (Atlas or GCP).
- Nginx can be scaled horizontally or replaced with GCP Load Balancer.
- Use auto-scaling and health checks for high availability.

## Notes
- SSL certificates auto-renewal should be set up (see Certbot docs).
- For persistent MongoDB, consider managed DB or backup strategies. 