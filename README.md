## What is this?

This is a somewhat rudimentary/hacky example of how to do per entrypoint translation bundling/tree-shaking using [next-intl](https://next-intl-docs.vercel.app/).

The core logic of the example is in the `TranslationsPlugin.js` file.

## Running

First, run the development server:

```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. To see the language changing happening use the select dropdown at the bottom of the page to change the language before clicking a link. The supported languages are "en-US" and "fr"

## How it works

We use the webpack JavascriptParser hooks to find `evaluateExpression` calls to `useTranslations` such as:

```js
const t = useTranslations();
```

and tag the variable declarator `t` so we can parse out the keys from later uses of `t` like:

```js
t("someKey");
```

For every module we track the module `identifier` and the translation keys used in that module in a `translationsMap`

Then for entrypoint (in a NextJS app that is every page) we identify all keys used in that entrypoint by iterating over it's modules, and emit a bundle for every language in the `.next/i18n` directory in a structure that mimics the page structure of the application.

Lastly at runtime in the `getServerSideProps` method of a page we identify which bundle to serve based on request path and request locale.

Author: Yash Vesikar
