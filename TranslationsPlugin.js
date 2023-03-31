const { Compilation } = require("webpack");
class PrintFileContentsPlugin {
  constructor(options) {
    this.options = options;
    this.compilation = null;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      "PrintFileContentsPlugin",
      // client side only
      (compilation, callback) => {
        if (compilation.compiler.name == "client") {
          compilation.hooks.processAssets.tapPromise(
            {
              name: "PrintFileContentsPlugin",
              stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
            },
            () => this.emitStats(compilation)
            // (assets) => {
            //   console.log("List of assets and their sizes:");
            //   Object.entries(assets).forEach(([pathname, source]) => {
            //     console.log(`— ${pathname}: ${source.size()} bytes`);
            //   });
            // }
          );

          // const { entrypoints } = compilation;

          // entrypoints.forEach((entrypoint) => {
          //   const { chunks } = entrypoint;
          //   console.log(`Entrypoint: ${entrypoint.name}`);
          //   chunks.forEach((chunk) => {
          //     const { files } = chunk;

          //     console.log(`Chunk: ${chunk.name}`);

          //     files.forEach((file) => {
          //       const source = compilation.assets[file].source();
          //       //   if (file.endsWith)
          //       console.log(`File: ${file}`);
          //       //   console.log(`Contents: \n${source}\n`);
          //     });
          //   });
          // });
        }
      }
    );
  }

  emitStats(curCompiler) {
    // Get stats.
    // The second argument automatically skips heavy options (reasons, source, etc)
    // if they are otherwise unspecified.
    let stats = curCompiler.getStats().toJson();
  }
}

module.exports = PrintFileContentsPlugin;
