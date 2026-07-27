const baseConfig = require('./webpack.config');

module.exports = {
	...baseConfig,
	output: {
		...baseConfig.output,
		publicPath: 'auto',
	},
};
