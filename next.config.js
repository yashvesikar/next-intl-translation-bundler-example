const TranslationsPlugin = require("./TranslationsPlugin");
const i18nConfig = require("./i18n.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  webpack: (
    /** @type {import('next/dist/server/config-shared').NextJsWebpackConfig} */
    config,
    { dev, isServer }
  ) => {
    config.plugins.push(new TranslationsPlugin({}));
    // config.mode = "development";
    return config;
  },
  i18n: i18nConfig.i18n,
};

module.exports = nextConfig;
