"use client";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useEffect, useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CLUB_FB, CLUB_INSTA } from "@/utils/defines/SOCIAL";

const Footer = () => {
  const locale = useLocale();
  const t = useTranslations();
  
  // Create fallback links using translations
  const fallbackLinks = useMemo(() => [
    { label: t('navigation.aboutUs'), href: `/${locale}/about-us` },
    { label: t('navigation.events'), href: `/${locale}/events` },
    { label: t('navigation.news'), href: `/${locale}/news` },
    { label: t('navigation.gallery'), href: `/${locale}/gallery` },
    { label: t('navigation.contactUs'), href: `/${locale}/contact-us` },
    // { label: t('navigation.documents'), href: `/${locale}/documents` },
  ], [locale, t])

  const [footerLinks, setFooterLinks] = useState<any>(fallbackLinks);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/layout-data?locale=${locale}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        // Check if links have proper translations (not raw keys)
        if (data?.footerLinks && Array.isArray(data.footerLinks) && data.footerLinks.length > 0) {
          const hasValidTranslations = data.footerLinks.every((link: any) => 
            link.label && !link.label.startsWith('navigation.')
          )
          if (hasValidTranslations) {
            setFooterLinks(data.footerLinks);
          } else {
            // API returned keys instead of translations, use fallback
            setFooterLinks(fallbackLinks);
          }
        } else {
          // Fallback to translated links
          setFooterLinks(fallbackLinks);
        }
      } catch (error) {
        console.error("Error fetching footer links:", error);
        // Fallback to translated links on error
        setFooterLinks(fallbackLinks);
      }
    };
    fetchData();
  }, [locale, fallbackLinks]);
  return (
    <footer className="relative z-10 bg-dark">
      <div className="container mx-auto max-w-8xl pt-10 md:pt-14 px-5 2xl:px-0">
        <div className="py-10 md:py-16 border-b border-white/10">
          <div className="grid grid-cols-2 md:flex md:flex-row md:justify-between gap-6 md:gap-12">
            {/* Logo and Social Media Links */}
            <div className="flex flex-col gap-4 md:gap-6">
              <Link href={`/${locale}`} className="w-fit">
                <Image
                  src="/images/logos/logo-50.gif"
                  alt="Regatta Port Bourgas Logo"
                  width={120}
                  height={120}
                  unoptimized={true}
                  className="h-auto w-20 md:w-32 rounded-full"
                />
              </Link>
              <div className="flex items-center gap-3 md:gap-6">
                <a
                  href={CLUB_FB}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary duration-300 transition-colors"
                  aria-label="Facebook"
                >
                  <Icon
                    icon="ph:facebook-logo-bold"
                    width={24}
                    height={24}
                    className="md:w-8 md:h-8"
                  />
                </a>
                <a
                  href={CLUB_INSTA}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary duration-300 transition-colors"
                  aria-label="Instagram"
                >
                  <Icon
                    icon="ph:instagram-logo-bold"
                    width={24}
                    height={24}
                    className="md:w-8 md:h-8"
                  />
                </a>
              </div>
            </div>

            {/* Footer Links - Combined for mobile, split for desktop */}
            <div className="flex flex-col gap-2 md:gap-4">
              {footerLinks?.slice(0, 4)?.map((item: any, index: any) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-white/60 hover:text-white  md: lg:text-base transition-colors duration-300 w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Footer Links - Second Column (hidden on mobile, shown on desktop) */}
            <div className="hidden md:flex flex-col gap-3 md:gap-4">
              {footerLinks?.slice(4, 8)?.map((item: any, index: any) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-white/60 hover:text-white  md:text-base transition-colors duration-300 w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Additional links for mobile (second column) */}
            <div className="flex flex-col gap-2 md:hidden">
              {footerLinks?.slice(4, 8)?.map((item: any, index: any) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-white/60 hover:text-white  transition-colors duration-300 w-fit"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 md:py-8 gap-4 sm:gap-6">
          <p className="text-white/60  sm:">
            © {new Date().getFullYear()} Regatta Port Bourgas. Developed by{" "}
            <Link
              href="https://vladislavmarinov.com/"
              className="hover:text-primary transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cold Lake Technologies
            </Link>
          </p>
          {/* <div className="flex flex-wrap gap-4 sm:gap-8 items-center">
            <Link
              href="/terms-and-conditions"
              className="text-white/60 hover:text-primary  sm: transition-colors duration-300"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/privacy-policy"
              className="text-white/60 hover:text-primary  sm: transition-colors duration-300"
            >
              Privacy Policy
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
