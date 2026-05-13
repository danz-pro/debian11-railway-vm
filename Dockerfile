# ============================================
# Debian 11 Web Terminal - Railway Deploy
# Akses root via browser (ttyd)
# ============================================
FROM debian:11-slim

LABEL maintainer="Railway VM"
LABEL description="Debian 11 Web Terminal with Root Access"

# Non-interactive install
ENV DEBIAN_FRONTEND=noninteractive

# Update & install essentials
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
    lsb-release \
    unzip \
    jq \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Install ttyd (web terminal)
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then \
        TTYD_ARCH="x86_64"; \
    elif [ "$ARCH" = "aarch64" ]; then \
        TTYD_ARCH="aarch64"; \
    else \
        TTYD_ARCH="x86_64"; \
    fi && \
    wget -qO /tmp/ttyd.tar.gz "https://github.com/tsl0922/ttyd/releases/latest/download/ttyd.${TTYD_ARCH}.tar.gz" && \
    tar -xzf /tmp/ttyd.tar.gz -C /usr/local/bin ttyd && \
    chmod +x /usr/local/bin/ttyd && \
    rm -f /tmp/ttyd.tar.gz

# Setup root password (change this!)
RUN echo 'root:debian11' | chpasswd

# Create entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Railway expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -sf http://localhost:8080/ || exit 1

WORKDIR /root

ENTRYPOINT ["/entrypoint.sh"]
