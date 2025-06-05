import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*', // Para rutas del backend que usan /api/v1/
        destination: 'http://localhost:8000/api/v1/:path*' // Las redirige al backend con /api/v1/
      },
      {
        source: '/api/:path*', // Para rutas del backend que usan solo /api/ (como diagrams, credentials)
        destination: 'http://localhost:8000/api/:path*' // Las redirige al backend sin /v1
      }
      // Next.js procesa las reescrituras en orden.
      // Una llamada a /api/v1/some/path coincidirá con la primera regla.
      // Una llamada a /api/other/path coincidirá con la segunda regla.
    ];
  }
};

export default nextConfig;
