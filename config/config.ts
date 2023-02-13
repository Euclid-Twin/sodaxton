import { defineConfig } from "umi";

export default defineConfig({
  define: {
    "process.env.CHAIN_ENV": "TONtest",
    "process.env.TON_SERVER": "https://soton.sonet.one/api/v1",
  },
  headScripts: ["https://telegram.org/js/telegram-web-app.js"],
  request: {},
  hash: true,
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
      ],
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
