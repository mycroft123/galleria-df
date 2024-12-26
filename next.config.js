/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['bafybeiey74fhfsbksvnzlgdix4vilwcbuvs32oc2gdd4pksvrezhn7kw7e.ipfs.nftstorage.link'],
    },
    experimental: {
        runtime: 'edge',
        serverActions: true,
    }
};

module.exports = nextConfig;
