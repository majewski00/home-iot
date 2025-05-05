module.exports = (serverless) => ({
  format: "esm",
  platform: "node",
  target: "esnext",
  banner: {
    js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
  },

  bundle: true,
  sourcemap: "external",
  minify: serverless.service.provider.stage === "prod",
  alias: {
    "@apiRoutes": "./../../commons/routes.ts",
    "@helpers/*": "./../../commons/helpers/*",
    "@src-types/*": "./../../commons/types/*",
  },
});
