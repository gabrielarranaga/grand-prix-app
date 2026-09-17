import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  // Permite el hot-reload del servidor de desarrollo cuando se prueba desde
  // el celular por la IP local de la red WiFi, no solo desde localhost.
  allowedDevOrigins: ["192.168.100.5"],
};

export default nextConfig;
