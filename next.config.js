/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// GitHub Pages serves this project site under /AI-Voice-Notes/.
// basePath/assetPrefix are only applied in production builds so `npm run dev`
// still works at http://localhost:3000/.
const nextConfig = {
  output: 'export', // emit a fully static site into ./out
  basePath: isProd ? '/AI-Voice-Notes' : '',
  assetPrefix: isProd ? '/AI-Voice-Notes/' : '',
  images: { unoptimized: true }, // no Image Optimization server on static hosts
  trailingSlash: true, // emit out/index.html-style paths that Pages serves cleanly
};

module.exports = nextConfig;
