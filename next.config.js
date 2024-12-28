/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'],
    },
    experimental: {
        largePageDataBytes: 128 * 100000, // Increase size limit to ~12.8MB
    },
};

module.exports = nextConfig;