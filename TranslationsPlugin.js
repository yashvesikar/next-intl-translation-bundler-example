/** @author: yashvesikar */
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const i18nConfig = require("./i18n.config");

const { Compilation } = webpack;
const { RawSource, RawModule } = webpack.sources;

const CustomTranslationCallTag = Symbol("CustomTranslationCallTag");

function readJsonFile(filePath) {
  // slowest possible way to read a file - probably the biggest bottleneck of the whole plugin
  const fileData = fs.readFileSync(filePath);
  const jsonData = JSON.parse(fileData);
  return jsonData;
}

class TranslationPlugin {
  constructor() {
    this.translationsMap = new Map();
    const locales = i18nConfig.i18n.locales;
    this.translations = locales.reduce((acc, locale) => {
      // get relative path to src/messages directory
      const relativePath = path.join(
        __dirname,
        "src",
        "messages",
        `${locale}.json`
      );
      acc[locale] = readJsonFile(relativePath);
      return acc;
    }, {});

    this.translationManifest = {};
    this.emitTranslationBundle = this.emitTranslationBundle.bind(this);
    this.generateTranslationsMap = this.generateTranslationsMap.bind(this);
  }

  apply(compiler) {
    if (compiler.options.name !== "client") {
      return;
    }

    this.generateTranslationsMap(compiler);

    // compiler.hooks.emit.tap(
    compiler.hooks.thisCompilation.tap(
      "TranslationPlugin",
      // client side only
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "TranslationPlugin",
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
          },
          (_) => {
            const { entrypoints } = compilation;
            entrypoints.forEach((entrypoint) => {
              this.emitTranslationBundle(compiler, compilation, entrypoint);
            });
          }
        );
        return true;
      }
    );
  }

  /**
   * Extracts all the t("") function call arguments.
   * This could technically be done in a webpack loader using clever regex but by using the AST the solution is technically more correct in generic albeit slower.
   * @param {webpack.Compiler} compiler
   */
  generateTranslationsMap(compiler) {
    compiler.hooks.normalModuleFactory.tap("TranslationPlugin", (factory) => {
      factory.hooks.parser
        .for("javascript/auto")
        .tap("TranslationPlugin", (parser) => {
          // find all call expressions to useTranslations hook and extract the declared variable name - conventionally this is `t`
          parser.hooks.evaluateCallExpression
            .for("useTranslations")
            .tap("TranslationPlugin", (expr) => {
              const isDeclaration =
                parser.statementPath.at(-1).type === "VariableDeclaration";
              if (isDeclaration) {
                const declarations = parser.statementPath.at(-1).declarations;
                const variableName =
                  declarations[0].type === "VariableDeclarator"
                    ? declarations[0].id.name
                    : null;
                if (!variableName) return;
                parser.tagVariable(variableName, CustomTranslationCallTag);
              }
            });

          // find all call expressions to declared variable name i.e. t("key") function and extract the argument "key"
          // generate the translation map module identifier -> {key1, key2, ...}
          parser.hooks.expression
            .for(CustomTranslationCallTag)
            .tap("TranslationPlugin", (expr) => {
              const regex = new RegExp(`${expr.name}\\("([^"]+)"\\)`, "g");
              const matches = parser.state.source
                .match(regex)
                .map((match) =>
                  match.substring(expr.name.length + 2, match.length - 2)
                );
              if (this.translationsMap.has(parser.state.current.identifier())) {
                this.translationsMap.set(
                  parser.state.current.identifier(),
                  new Set([
                    ...this.translationsMap.get(
                      parser.state.current.identifier()
                    ),
                    ...matches,
                  ])
                );
              } else {
                this.translationsMap.set(
                  parser.state.current.identifier(),
                  new Set(matches)
                );
              }
            });
        });
    });
  }

  /**
   * Emit translation bundle for each entrypoint with only the translations used in the entrypoint
   * @param {webpack.Compilation} compilation
   * @param {*} entrypoint
   * @returns
   */
  emitTranslationBundle(compiler, compilation, entrypoint) {
    entrypoint._modulePostOrderIndices.forEach((_, value) => {
      const identifier = value.identifier();
      // if this is the primary entrpoint mdoule
      if (this.translationsMap.has(identifier)) {
        Object.keys(this.translations).forEach((locale) => {
          const outputPathAndFilename = path.resolve(
            compilation.options.output.path,
            "i18n",
            entrypoint.options.name,
            `${locale}.json`
          );

          const relativeOutputPath = path.relative(
            compilation.options.output.path,
            outputPathAndFilename
          );

          const content = {};
          for (let key of this.translationsMap.get(identifier).values()) {
            let translation = this.translations[locale][key];
            if (!translation) {
              console.warn(`Missing translation for key: ${key}`);
              translation = key;
            }

            content[key] = translation;
          }

          // emit the translation bundle
          compilation.emitAsset(
            relativeOutputPath,
            new RawSource(JSON.stringify(content))
          );
        });
      }
    });
    return;
  }
}

module.exports = TranslationPlugin;
