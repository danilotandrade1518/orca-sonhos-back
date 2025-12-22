#!/bin/bash
# Script para executar migrations do banco de dados
# Detecta automaticamente se está rodando dentro ou fora do Docker

set -e

# Carregar variáveis do .env se existir
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Detectar se está dentro do Docker (hostname = db) ou fora (localhost)
if [ -z "$DB_HOST" ]; then
  # Tentar detectar automaticamente
  if docker-compose ps db > /dev/null 2>&1; then
    # Docker está rodando, usar localhost (porta mapeada)
    DB_HOST=localhost
  else
    # Docker não está rodando, tentar localhost
    DB_HOST=localhost
  fi
fi

# Usar valores padrão se não definidos
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-senha}
DB_NAME=${DB_NAME:-orcasonhos}

# Construir DATABASE_URL
export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "🔄 Executando migrations..."
echo "📊 Banco: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo ""

npm run migrate

echo ""
echo "✅ Migrations concluídas com sucesso!"
