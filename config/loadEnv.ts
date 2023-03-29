import * as dotenv from "dotenv";
const path = require("path");
function loadEnv() {
  const pathOfEnv = path.resolve(process.cwd(), `.env.${process.env.APP_ENV}`);
  dotenv.config({ path: pathOfEnv });
}
loadEnv();
