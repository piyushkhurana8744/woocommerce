const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Accepts any domain over HTTPS
      },
    ],
  },
};

export default nextConfig;
