import Image from "next/image";
import { Metadata } from "next";
import { Icon } from "@iconify/react/dist/iconify.js"
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Header from "./components/layout/header";

export const metadata: Metadata = {
  title: "Page Not Found | International Regatta Port Bourgas",
  robots: { index: false, follow: false },
};

export default async function NotFoundPage() {
  // Try to get translations, fallback to English if locale is not available
  let t: {
    (key: string): string;
  };
  try {
    t = await getTranslations('notFound');
  } catch {
    // Fallback translations if locale context is not available
    const fallbackTranslations = {
      error404: 'Error 404',
      title: "Lost? Let's Help You Find Home.",
      description: "Looks like you've hit a dead end — but don't worry, we'll help you get back on track",
      goHome: 'Go Home',
      contactUs: 'Contact Us'
    };
    t = (key: string) => fallbackTranslations[key as keyof typeof fallbackTranslations] || key;
  }

  return (
    <main className="site-page-bg min-h-screen">
      <div className="container mx-auto">
        <section className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logos/logo.jpg"
              alt="404"
              width={200}
              height={200}
              unoptimized={true}
            />
          </div>
          
          <section className="text-center bg-cover relative overflow-x-hidden w-full max-w-4xl mx-auto">
           
            <h2 className="text-dark text-4xl sm:text-5xl md:text-6xl lg:text-7xl relative font-bold dark:text-white mb-6">
              {t('title')}
            </h2>
            
            {/* <p className="text-lg text-dark/50 dark:text-white/50 font-normal w-full max-w-2xl mx-auto mb-8">
              {t('description')}
            </p> */}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <Link
                href="/en"
                className="px-8 py-4 border border-primary bg-primary text-white duration-300 hover:bg-primary/90 text-base font-semibold rounded-md hover:cursor-pointer"
              >
                {t('goHome')}
              </Link>
              <Link
                href="/en/contact-us"
                className="px-8 py-4 border border-dark dark:border-white bg-transparent text-dark dark:text-white hover:bg-dark dark:hover:bg-white hover:text-white dark:hover:text-dark duration-300 text-base font-semibold rounded-md hover:cursor-pointer"
              >
                {t('contactUs')}
              </Link>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
