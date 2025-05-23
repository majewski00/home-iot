module.exports = (serverless) => ({
  format: "cjs",
  platform: "node",
  target: "esnext",

  bundle: true,
  sourcemap: "external",
  minify: serverless.service.provider.stage === "prod",
  alias: {
    "@apiRoutes": "./../../commons/routes.ts",
    "@helpers/*": "./../../commons/helpers/*",
    "@src-types/*": "./../../commons/types/*",
  },
});
