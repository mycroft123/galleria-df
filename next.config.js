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
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Ignore node-specific modules when bundling for the browser
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                async_hooks: false,
                fs: false,
                net: false,
                tls: false,
                child_process: false,
                'supports-color': false
            };
        }

        // Add custom plugin to remove node: protocol imports
        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(
                /^node:/,
                (resource) => {
                    resource.request = resource.request.replace(/^node:/, '');
                }
            )
        );

        return config;
    },
    // Add this section
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['@fleek-platform/next-on-fleek']
    }
};

module.exports = nextConfig;
