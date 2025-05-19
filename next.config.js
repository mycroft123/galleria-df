/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'],
    },
    experimental: {
        largePageDataBytes: 128 * 100000, // Increase size limit to ~12.8MB
        disableOptimizedLoading: true, // Disable optimized loading to avoid prerendering issues
    },
    // Add webpack configuration for better file watching
    webpack: (config, { isServer }) => {
        config.watchOptions = {
            poll: 1000, // Check for changes every second
            aggregateTimeout: 300, // Delay before rebuilding
            ignored: ['**/node_modules', '**/.git', '**/.next'],
        }
        return config
    },
    // Add ESLint config to ignore errors during builds
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Add TypeScript config to ignore errors during builds
    typescript: {
        ignoreBuildErrors: true,
    },
    // Output standalone build
    output: 'standalone',
    // Disable static page generation
    distDir: 'build',
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    swcMinify: true,
    reactStrictMode: false, // Set to false to avoid potential issues with prerendering
};

module.exports = nextConfig;