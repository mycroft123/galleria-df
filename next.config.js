/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'
        }],
    },
    output: 'standalone',
    transpilePackages: ['@fleek-platform/next-on-fleek'],
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Resolve the async_hooks issue
            config.resolve = {
                ...config.resolve,
                fallback: {
                    ...config.resolve.fallback,
                    "async_hooks": false,
                    "net": false,
                    "tls": false,
                    "fs": false,
                    "child_process": false
                }
            }
        }
        return config;
    },
    // Remove experimental section completely if you have it
};

module.exports = nextConfig;
