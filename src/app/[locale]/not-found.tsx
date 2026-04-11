import Image from "next/image";
import { getTranslations, getLocale } from 'next-intl/server';
import { Icon } from "@iconify/react/dist/iconify.js"
import { Link } from '@/i18n/routing';

export default async function NotFoundPage() {
  const t = await getTranslations('notFound');
  const locale = await getLocale();

  return (
    <main className="site-page-bg min-h-screen">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <section className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/404.png"
              alt="404"
              width={490}
              height={450}
              unoptimized={true}
              className="w-full max-w-[490px] h-auto"
            />
          </div>
          
          <section className="text-center bg-cover relative overflow-x-hidden w-full max-w-4xl mx-auto">
            <div className='flex gap-2.5 items-center justify-center mb-6'>
              <span>
                <Icon
                  icon={'ph:house-simple-fill'}
                  width={20}
                  height={20}
                  className='text-primary'
                />
              </span>
              <p className='text-base font-semibold text-dark/75 dark:text-white/75'>
                {t('error404')}
              </p>
            </div>
            
            <h2 className="text-dark text-4xl sm:text-5xl md:text-6xl lg:text-7xl relative font-bold dark:text-white mb-6">
              {t('title')}
            </h2>
            
            <p className="text-lg text-dark/50 dark:text-white/50 font-normal w-full max-w-2xl mx-auto mb-8">
              {t('description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <Link
                href={`/${locale}`}
                className="px-8 py-4 border border-primary bg-primary text-white duration-300 hover:bg-primary/90 text-base font-semibold rounded-md hover:cursor-pointer"
              >
                {t('goHome')}
              </Link>
              <Link
                href={`/${locale}/contact-us`}
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
