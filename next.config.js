/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'],
    },
    experimental: {
        largePageDataBytes: 128 * 100000, // Increase size limit to ~12.8MB
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
};

module.exports = nextConfig;