const CracoLessPlugin = require("craco-less");

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              "@primary-color": "#42906A",
              "@link-color": "#71C794",
              "@warning-color": "#B28603",
              "@error-color": "#B7280E",
              "@success-color": "#327F19",
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};
