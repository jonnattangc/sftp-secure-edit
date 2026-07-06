FROM node:26.2.0-slim

RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/* && \
    echo "Bienvenido a la maquina CLAUDE" > /tmp/welcome.txt

USER node

RUN curl -fsSL https://claude.ai/install.sh | bash && \
    curl -fsSL https://opencode.ai/install | bash

ENV PATH="/home/node/.local/bin:${PATH}"

WORKDIR /home/node/workspace

CMD ["tail", "-f", "/tmp/welcome.txt"]

