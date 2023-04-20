import { defineConfig } from "umi";
import "./loadEnv";
export default defineConfig({
  define: {
    "process.env.BOT_TOKEN": process.env.BOT_TOKEN,
    "process.env.APP_ENV": process.env.APP_ENV,
    "process.env.TON_API_TOKEN": process.env.TON_API_TOKEN,
    "process.env.TON_CENTER_API_TOKEN": process.env.TON_CENTER_API_TOKEN,
    "process.env.CHAIN_ENV":
      process.env.APP_ENV === "prod" ? "TONmain" : "TONtest",
    "process.env.TON_SERVER":
      process.env.APP_ENV === "prod"
        ? "https://soton.sonet.one"
        : "https://soton-test.sonet.one",
    "process.env.API_HOST":
      process.env.APP_ENV === "prod"
        ? "https://apiv2.platwin.io/api/v1"
        : "https://apiv2-test.platwin.io/api/v1",
    "process.env.APP_URL":
      process.env.APP_ENV === "prod"
        ? "https://twa.soton.sonet.one"
        : "https://twa.soton-test.sonet.one/",
    "process.env.GETGEMS_COLLECTION_URL":
      process.env.APP_ENV === "prod"
        ? "https://getgems.io/collection"
        : "https://testnet.getgems.io/collection",
  },
  headScripts: ["https://telegram.org/js/telegram-web-app.js"],
  title: "Soton TWA Bot",
  metas: [
    { property: "og:title", content: "Soton" },
    { name: "ton-x-name", content: "Soton TWA Bot" },
    {
      name: "ton-x-image",
      content: "https://i.328888.xyz/2023/03/08/5KI9z.png",
    },
    {
      property: "og:logo",
      content: "https://i.328888.xyz/2023/03/08/5KI9z.png",
    },
    {
      itemprop: "og:logo",
      content: "https://i.328888.xyz/2023/03/08/5KI9z.png",
    },
    { itemprop: "og:logo", src: "https://tonwhales.com/mstile-310x310.png" },
    {
      name: "ton-x-description",
      content: "Link TON DAOs and NFTs to Telegram",
    },
    {
      property: "og:description",
      content: "Link TON DAOs and NFTs to Telegram",
    },
    { name: "description", content: "Link TON DAOs and NFTs to Telegram" },
    { itemprop: "description", content: "Link TON DAOs and NFTs to Telegram" },
  ],
  request: {},
  hash: true,
  webpack5: {},
  // chainWebpack: (config) => {
  //   config.module
  //     .rule("worker")
  //     .test(/\.worker\.js$/)
  //     .use("worker-loader")
  //     .loader("worker-loader");
  //   config.resolve.alias.set("buffer", require.resolve("buffer/"));
  // },

  routes: [
    {
      exact: false,
      path: "/",
      component: "@/layouts/index",
      routes: [
        { path: "/", component: "home" },
        { path: "/daos", component: "daos" },
        { path: "/dao/create", component: "daoCreate" },
        { path: "/daos/:id", component: "daoDetail" },
        { path: "/proposals", component: "proposals" },
        { path: "/proposals/create", component: "proposalCreate" },
        { path: "/web/proposals", component: "webProposals" },
        { path: "/collections", component: "collections" },
        { path: "/collection/create", component: "collectionCreate" },
        { path: "/collection/mint", component: "collectionMint" },
        { path: "/launchpads", component: "@/pages/launchPad/list" },
        { path: "/launchpad/deploy", component: "@/pages/launchPad/deploy" },
        {
          path: "/launchpad/participate",
          component: "@/pages/launchPad/participate",
        },
      ],
    },
  ],
  links: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com" },
    {
      href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap",
      rel: "stylesheet",
    },
  ],
  ghPages: {
    dir: "dist",
    // ...gh-pages#PublishOptions
  },
  // devServer: {
  //   https: {
  //     key: "../private.key",
  //     cert: "../private.crt",
  //   },
  // },
});
