module.exports = (serverless) => {
  return {
    bundle: true,
    minify: process.env.BUILD_STAGE === "prod",
    sourcemap: "external",
    alias: {
      "@apiRoutes": "./../commons/routes.ts",
      "@helpers/*": "./../commons/helpers/*",
      "@src-types/*": "./../commons/types/*",
    },
  };
};
