import { defineConfig } from "umi";

export default defineConfig({
  define: {
    "process.env.CHAIN_ENV": "TONtest",
    "process.env.TON_SERVER": "https://soton.sonet.one",
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
