import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Icon } from "@iconify/react";
import { getNewsItem } from "@/lib/news";
import { localizeText } from "@/lib/localizedContent";
import { extractNewsAttachmentLinks } from "@/lib/newsAttachments";
import markdownToHtml from "@/lib/markdownToHtml";
import { formatDisplayDate } from "@/lib/formatDate";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.regattaportbourgas.com";

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params;
  const news = await getNewsItem(slug);

  if (!news) return {};

  const title = localizeText(locale, news.name_en, news.name_bg);
  const description = localizeText(
    locale,
    news.description_en,
    news.description_bg,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: news.created_at,
      modifiedTime: news.updated_at,
      images: [
        {
          url: `${siteUrl}/images/banner.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteUrl}/images/banner.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/news/${slug}`,
      languages: {
        en: `${siteUrl}/en/news/${slug}`,
        bg: `${siteUrl}/bg/news/${slug}`,
      },
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations();
  const locale = await getLocale();

  const news = await getNewsItem(slug);

  if (!news) {
    notFound();
  }

  const title = localizeText(locale, news.name_en, news.name_bg);
  const description = localizeText(
    locale,
    news.description_en,
    news.description_bg,
  );
  const body = localizeText(locale, news.body_en, news.body_bg);
  const formattedDate = formatDisplayDate(news.created_at);
  const bodyHtml = /<([a-z][^/\s>]*)\b[^>]*>/i.test(body)
    ? body
    : await markdownToHtml(body);
  const attachments = extractNewsAttachmentLinks(body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    datePublished: news.created_at,
    dateModified: news.updated_at,
    image: `${siteUrl}/images/banner.png`,
    url: `${siteUrl}/${locale}/news/${news.slug}`,
    publisher: {
      "@type": "SportsOrganization",
      name: "Yacht Club Port Bourgas",
      logo: { "@type": "ImageObject", url: `${siteUrl}/images/logos/logo.jpg` },
    },
    author: { "@type": "Organization", name: "Yacht Club Port Bourgas" },
    inLanguage: locale === "bg" ? "bg-BG" : "en-US",
  };

  return (
    <main className="site-page-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 font-semibold text-dark/70 dark:text-white/70 hover:text-primary transition-colors mb-6"
        >
          ← {t("news.back")}
        </Link>

        <article className="max-w-4xl m-auto">
          <div className="flex items-center gap-2  text-dark/60 dark:text-white/60 mb-4">
            <Icon
              icon="ph:calendar-blank-bold"
              width={18}
              height={18}
              className="text-primary"
            />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-6">
            {title}
          </h1>

          <div className="blog-details news-article-body prose prose-lg prose-zinc max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-2xl prose-img:shadow-lg">
            <div
              className="text-xl leading-loose text-dark/80 dark:text-white/80"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>

          {attachments.length > 0 ? (
            <section className="mt-12 rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30">
              <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
                Attachments
              </h2>
              <ul className="space-y-3">
                {attachments.map((attachment) => {
                  const fallbackLabel =
                    attachment.url.split("/").pop()?.split("?")[0] ||
                    attachment.url;

                  return (
                    <li key={attachment.url}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2  font-medium text-primary hover:underline"
                      >
                        <Icon icon="ph:paperclip-bold" width={18} height={18} />
                        {decodeURIComponent(attachment.label || fallbackLabel)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  );
}
