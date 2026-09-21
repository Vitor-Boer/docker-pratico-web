import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Gera .next/standalone, que o Dockerfile copia para a imagem final (enxuta).
  output: 'standalone',
};

export default nextConfig;
