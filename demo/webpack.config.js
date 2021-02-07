const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    plugins: [
        new CleanWebpackPlugin({
            verbose: true
        })
    ],
    output: {
        filename: "[name].js",
        path: __dirname + "/js/bundle",
        library: "TagInputDemo"
    },
    entry: {
        demo: "./js/demo.ts"
    },
    devtool: "source-map",
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: "ts-loader"
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"]
            }
        ]
    }
};
