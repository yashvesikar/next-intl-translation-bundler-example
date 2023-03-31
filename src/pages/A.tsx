import {
  getTranslationBundleFromContext,
  useTranslationsCustom,
} from "@/translation-utils";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";

function A(props: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { messages } = props;
  const t = useTranslationsCustom();

  return (
    <ul>
      <li>{t("title") + ": " + t("pageA")}</li>
      <li>bundle: {JSON.stringify(messages)}</li>
    </ul>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const translationBundle = await getTranslationBundleFromContext(context);
  return {
    props: {
      // You can get the messages from anywhere you like. The recommended
      // pattern is to put them in JSON files separated by language.
      messages: translationBundle,
    },
  };
};

export default A;
