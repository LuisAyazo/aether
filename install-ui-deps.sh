#!/bin/bash

# Script para instalar las dependencias UI necesarias
echo "Installing UI dependencies for Multi-Tenant UI..."

npm install --save \
  clsx \
  class-variance-authority \
  tailwind-merge \
  sonner \
  cmdk \
  @radix-ui/react-avatar \
  @radix-ui/react-command \
  @radix-ui/react-popover

echo "✅ Dependencies installed successfully!"
