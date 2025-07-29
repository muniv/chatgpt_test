const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
})

const withPWA = require("next-pwa")({
  dest: "public"
})

module.exports = withBundleAnalyzer(
  withPWA({
    reactStrictMode: true,
    // GitHub Pages 배포 최적화
    trailingSlash: true,
    output: 'export',
    distDir: 'out',
    images: {
      unoptimized: true,
      remotePatterns: [
        {
          protocol: "http",
          hostname: "localhost"
        },
        {
          protocol: "http",
          hostname: "127.0.0.1"
        },
        {
          protocol: "https",
          hostname: "**"
        },
        {
          protocol: "https",
          hostname: "oaidalleapiprodscus.blob.core.windows.net"
        }
      ]
    },
    experimental: {
      serverComponentsExternalPackages: ["sharp", "onnxruntime-node"]
    },
    // GitHub Pages base path 설정
    basePath: process.env.NODE_ENV === 'production' ? '/chatgpt_test' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/chatgpt_test/' : ''
  })
)
