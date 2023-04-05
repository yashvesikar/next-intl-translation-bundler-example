import { GetStaticPropsContext } from "next";

export async function getTranslationBundleFromContext(
  filename: string,
  context: GetStaticPropsContext<
    import("querystring").ParsedUrlQuery,
    import("next").PreviewData
  >
): Promise<Record<string, string>> {
  const translationFilePath = filename
    .replace(/.*pages\/(.*)(\/.*)?.js/, ".next/i18n/pages/$1/{locale}.json")
    .replace("{locale}", context.locale ?? "en-US");
  const fs = (await import("fs")).default;

  const data = JSON.parse(fs.readFileSync(translationFilePath).toString());
  return Promise.resolve(data);
}
