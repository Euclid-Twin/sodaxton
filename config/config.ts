import { defineConfig } from "umi";

export default defineConfig({
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
        { path: "/daos/:id", component: "daoDetail" },
        { path: "/proposals", component: "proposals" },
        { path: "/proposals/:id", component: "proposalDetail" },
        { path: "/proposals/create", component: "proposalCreate" },
      ],
    },
  ],
  // devServer: {
  //   https: {
  //     key: "../private.key",
  //     cert: "../private.crt",
  //   },
  // },
});
