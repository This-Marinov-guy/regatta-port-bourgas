import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { useTranslations, useLocale } from 'next-intl'

const Hero: React.FC = () => {
  const t = useTranslations('hero')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  return (
    <section className="!py-0">
      <div className="bg-gradient-to-b from-skyblue via-lightskyblue dark:via-[#4298b0] to-white/10 dark:to-black/10 overflow-hidden relative">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/images/videos/background.mp4" type="video/mp4" />
        </video>
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/20 dark:from-black/60 dark:via-black/50 dark:to-black/40 z-[1]" />
        <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-60 md:pb-68 relative z-10">
          <div className="relative text-white dark:text-dark text-center md:text-start z-20">
            {/* <p className="text-inherit text-xm font-medium">{t('location')}</p> */}
            <h1 className="text-inherit text-6xl sm:text-9xl font-medium -tracking-wider md:max-w-45p mt-4 mb-6">
              {/* {romanYears + " " + t("title")} */}
              {t("title")}
            </h1>
            <div className="flex flex-col xs:flex-row justify-center md:justify-start gap-4 mb-10">
              <Link
                href={`/contact-us`}
                className="px-4 py-2 border border-primary bg-primary text-white duration-300 hover:bg-primary/90 text-base font-semibold rounded-md  hover:cursor-pointer flex items-center justify-center"
              >
                {tCommon("getInTouch")}
              </Link>
              <Link
                href={`/properties`}
                className="px-4 py-2 border border-white bg-white text-dark dark:bg-white dark:text-dark duration-300 hover:bg-white/90 text-base font-semibold rounded-md hover:cursor-pointer flex items-center justify-center"
              >
                {tCommon("viewDetails")}
              </Link>
              <a
                href={`https://www.bulstrad.bg/`}
                className="px-4 py-2 border border-white bg-white text-dark dark:bg-white dark:text-dark duration-300 hover:bg-white/90 text-base font-semibold rounded-md hover:cursor-pointer flex items-center justify-center"
              >
                <Image
                  src="/images/brands/bulstrad.png"
                  alt="PDF"
                  width={150}
                  height={150}
                />
              </a>
            </div>
          </div>
          {/* <div className='hidden md:block absolute -top-2 -right-68'>
            <Image
              src={'/images/hero/heroBanner.png'}
              alt='heroImg'
              width={1082}
              height={1016}
              priority={false}
              unoptimized={true}
            />
          </div> */}
        </div>

        {/* General Sponsor Panel
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20 dark:border-white/10 z-30">
          <div className="flex flex-col items-center gap-2 min-w-[120px]">
            <p className="font-semibold text-dark dark:text-white uppercase tracking-wide">
              {t('generalSponsor')}
            </p>
            <div className="flex items-center justify-center w-full">
              <Image
                src="/images/brands/bulstrad.png"
                alt="Bulstrad"
                width={300}
                height={300}
                className="max-w-full max-h-full object-contain"
                unoptimized={true}
              />
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}

export default Hero
