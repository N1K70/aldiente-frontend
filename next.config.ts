import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reads PORT env variable from preview_start
  async redirects() {
    return [
      { source: "/appointments", destination: "/citas", permanent: true },
      { source: "/messages", destination: "/chat", permanent: true },
      { source: "/profile", destination: "/perfil", permanent: true },
      { source: "/reservations", destination: "/reservas", permanent: true },
      { source: "/services", destination: "/servicios", permanent: true },
      { source: "/professionals", destination: "/profesionales", permanent: true },
    ];
  },
};

export default nextConfig;
