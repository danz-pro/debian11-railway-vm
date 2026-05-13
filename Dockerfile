# ============================================
# Debian 11 Web Terminal - Persistent 24/7
# Node.js + WebSocket + Persistent Bash Shell
# ============================================
FROM node:18-slim

LABEL maintainer="Railway VM"
LABEL description="Debian 11 Web Terminal - Persistent 24/7 Session"

# Non-interactive install
ENV DEBIAN_FRONTEND=noninteractive

# Install system tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    sudo \
    git \
    nano \
    vim \
    htop \
    net-tools \
    iputils-ping \
    openssh-client \
    ca-certificates \
    gnupg \
    unzip \
    jq \
    procps \
    screen \
    && rm -rf /var/lib/apt/lists/*

# Setup root password (change this!)
RUN echo 'root:debian11' | chpasswd

# Create app directory
WORKDIR /app

# Copy app files
COPY package.json .
RUN npm install --production

COPY server.js .
COPY public/ ./public/

# Railway expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]
