import { GetStaticPropsContext } from "next";
import { useTranslations } from "next-intl";

export async function getTranslationBundleFromContext(
  context: GetStaticPropsContext<
    import("querystring").ParsedUrlQuery,
    import("next").PreviewData
  >
): Promise<Record<string, string>> {
  console.log("DEBUG: cwd", process.cwd());
  console.log("context.locale", context.locale);
  return (await import(`src/messages/${context.locale}.json`)).default;
}

export function useTranslationsCustom() {
  return useTranslations();
}
