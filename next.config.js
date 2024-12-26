/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: 'bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'
        }],
    },
    // Add Fleek-specific config
    output: 'standalone',
    transpilePackages: ['@fleek-platform/next-on-fleek']
};

module.exports = nextConfig;
