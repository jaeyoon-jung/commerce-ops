import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-5 py-16">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <p className="text-sm">{t("scaffoldNotice")}</p>

      <Button
        className="w-full sm:w-auto"
        render={<Link href="/api/health">{t("healthLink")}</Link>}
      />
    </main>
  );
}
