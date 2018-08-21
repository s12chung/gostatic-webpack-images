const ImageminPlugin = require('imagemin-webpack-plugin').default;

const RESPONSIVE_EXT = /\.(png|jpg)$/;
const NON_RESPONSIVE_EXT = /\.(gif|svg)$/;
const ROOT_FAVICON_FILES = [
    "favicon.ico",
    "browserconfig.xml"
];

const fileLoader = function(outputPath, name) {
    return {
        loader: 'file-loader',
        options: {
            outputPath: outputPath,
            name: name,
        }
    };
};

const responsive = function(jsonOutputPath, imageName) {
    return [
        fileLoader(jsonOutputPath, '[name].[ext].json'),
        'webpack-stringify-loader',
        {
            loader: 'responsive-loader',
            options: {
                name: imageName,
                quality: 85, // this is default for JPEG, making it explicit
                adapter: require('responsive-loader/sharp'),
                sizes: [325, 750, 1500, 3000, 6000]
            }
        }
    ];
};

const Generator = function (configDirname, filename, isProduction) {
    this.configDirname = configDirname;
    this.filename = filename;
    this.isProduction = isProduction;
};

Object.assign(Generator.prototype, {
    relativePath(p) { return require('path').resolve(this.configDirname, p); },

    faviconRules(faviconFilesPath) {
        let rootFaviconFiles = ROOT_FAVICON_FILES.map(function (faviconFilename) {
            return this.relativePath(faviconFilesPath + "/" + faviconFilename)
        }.bind(this));

        return [
            {
                exclude: rootFaviconFiles,
                include: this.relativePath(faviconFilesPath),
                use: [fileLoader('favicon/', '[name].[ext]')]
            },
            {
                include: rootFaviconFiles,
                use: [fileLoader('../', '[name].[ext]')]
            }
        ];
    },
    responsiveRules(include, outputPath) {
        return [
            {
                test: NON_RESPONSIVE_EXT,
                include: include,
                use: [fileLoader(outputPath, this.filename + '.[ext]')]
            },
            {
                test: RESPONSIVE_EXT,
                include: include,
                use: responsive(outputPath + "responsive/", outputPath + this.filename + '-[width].[ext]')
            }
        ]
    },
    optimizationPlugins() {
        return [
            // lossless compression, responsive-loader will do a quality change on JPEG to 85 quality
            new ImageminPlugin({
                test: /\.(png|gif|svg)$/,
                // this is where hard-source-webpack-plugin stores it's cache too
                cacheFolder: this.relativePath('node_modules/.cache/imagemin'),
                jpegtran: null
            })
        ];
    }
});

module.exports = function (configDirname, filename, isProduction) {
    return new Generator(configDirname, filename, isProduction);
};