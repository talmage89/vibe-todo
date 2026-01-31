#!/bin/bash
set -euo pipefail

echo "Setting up worktree environment..."

# Copy environment configuration
if [ ! -f .env.local ]; then
	echo "Creating .env.local from .env.example..."
	cp .env.example .env.local
else
	echo ".env.local already exists, skipping..."
fi

# Install dependencies
echo "Installing dependencies..."
bun install

# Generate Prisma client
echo "Generating Prisma client..."
bun run db:generate

echo "Worktree setup complete!"