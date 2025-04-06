const path = require('path');

module.exports = {
    mode: 'development', // Change to 'production' for production builds
    entry: './src/index.ts', // Entry file of your application
    output: {
        filename: 'bundle.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
        clean: true, // Clean the output directory before each build
        //libraryTarget: 'var',
    },
    resolve: {
        extensions: ['.ts', '.js'], // Allow TypeScript and JavaScript extensions
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Process .ts files with ts-loader
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};