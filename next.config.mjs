import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true, // WARNING: This is only okay because this is a protype.
    // TODO: actually fix eslint warnings
  },
  typescript: {
    ignoreBuildErrors: true, // WARNING: This is dangerous and only borderline okay for a prototype.
    // TODO: actually fix typescript errors.
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
});
