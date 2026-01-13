'use client'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const Partners: React.FC = () => {
  const t = useTranslations('partners')

  const partners = [
    {
      name: 'BSF',
      logo: '/images/brands/bsf.png',
      alt: 'BSF'
    },
    {
      name: 'Multraship',
      logo: '/images/brands/multraship.jpeg',
      alt: 'Multraship'
    },
    {
      name: 'Burgas',
      logo: '/images/brands/burgas.png',
      alt: 'Burgas'
    },
    {
      name: 'Yacht Club',
      logo: '/images/brands/yachtclub.png',
      alt: 'Yacht Club'
    },
    {
      name: 'Port',
      logo: '/images/brands/port.png',
      alt: 'Port'
    },
    {
      name: 'Audi',
      logo: '/images/brands/audi.png',
      alt: 'Audi'
    },
    {
      name: 'Bulstrad',
      logo: '/images/brands/bulstrad.png',
      alt: 'Bulstrad'
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark dark:text-white mb-4">
            {t('title')}
          </h2>
          {/* <p className="text-lg text-dark/60 dark:text-white/60 max-w-2xl mx-auto">
            {t('description')}
          </p> */}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 md:gap-8 items-center justify-items-center">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-full h-24 md:h-32 p-4 bg-white dark:bg-black/50 rounded-lg border border-black/5 dark:border-white/10 hover:border-primary dark:hover:border-primary transition-all duration-300 hover:shadow-lg group"
            >
              <Image
                src={partner.logo}
                alt={partner.alt}
                width={150}
                height={80}
                className="max-w-full max-h-full object-contain opacity-100 transition-opacity duration-300"
                unoptimized={true}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Partners
