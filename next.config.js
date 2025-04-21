/** @type {import('next').NextConfig} */
const createMDX = require('@next/mdx');

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const nextConfig = {
  /* config options here */
  // Configure pageExtensions to include md and mdx
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

module.exports = withMDX(nextConfig);
