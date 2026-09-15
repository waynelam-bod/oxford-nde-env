const baseConfig = require('./webpack.config');

// In prod, remoteEntry.js and its chunks are served from Alma's custom-package
// path (e.g. /nde/custom/{INST_ID}-{VIEW_ID}/), not the domain root. A static
// publicPath of '/' makes chunk requests 404, breaking the federation module
// load. 'auto' makes webpack resolve chunks relative to remoteEntry.js itself.
module.exports = {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    publicPath: 'auto',
  },
};
