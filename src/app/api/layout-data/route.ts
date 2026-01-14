import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { routing } from "@/i18n/routing";

// Link structure with translation keys
const navLinksStructure = [
  { labelKey: "navigation.home", href: "/" },
  { labelKey: "navigation.events", href: "/events" },
  { labelKey: "navigation.gallery", href: "/gallery" },
  { labelKey: "navigation.contactUs", href: "/contact-us" },
  { labelKey: "navigation.documents", href: "/documents" },
];

const footerLinksStructure = [
  { labelKey: "navigation.events", href: "/events" },
  { labelKey: "navigation.gallery", href: "/gallery" },
  { labelKey: "navigation.contactUs", href: "/contact-us" },
  { labelKey: "navigation.documents", href: "/documents" },
];

export const GET = async (request: NextRequest) => {
  // Get locale from query parameter, referer, or default
  const { searchParams } = new URL(request.url);
  let locale = searchParams.get("locale") as "en" | "bg" | null;

  // If not in query, try to detect from referer
  if (!locale) {
    const referer = request.headers.get("referer") || "";
    const localeMatch = referer.match(/\/(en|bg)(\/|$)/);
    if (localeMatch) {
      locale = localeMatch[1] as "en" | "bg";
    }
  }

  // Fallback to Accept-Language header
  if (!locale) {
    const acceptLanguage = request.headers.get("accept-language") || "";
    if (acceptLanguage.includes("bg")) {
      locale = "bg";
    } else {
      locale = "en";
    }
  }

  // Ensure locale is valid
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  try {
    // Load translations from JSON files
    const localesPath = join(process.cwd(), 'locales', `${locale}.json`);
    let messages: any = {};
    
    try {
      messages = JSON.parse(readFileSync(localesPath, 'utf8'));
    } catch (fileError) {
      console.error(`Failed to read locale file for ${locale}:`, fileError);
      // Return empty object if file read fails
      messages = {};
    }

    // Helper function to get nested translation value
    const getTranslation = (key: string, obj: any): string => {
      const keys = key.split('.');
      let value: any = obj;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Return key if translation not found
        }
      }
      return typeof value === 'string' ? value : key;
    };

    // Build nav links with translations and locale-aware hrefs
    const navLinks = navLinksStructure.map((link) => ({
      label: getTranslation(link.labelKey, messages),
      href: `/${locale}${link.href}`,
    }));

    // Build footer links with translations and locale-aware hrefs
    const footerLinks = footerLinksStructure.map((link) => ({
      label: getTranslation(link.labelKey, messages),
      href: `/${locale}${link.href}`,
    }));

    return NextResponse.json({
      navLinks,
      footerLinks,
    });
  } catch (error) {
    console.error('Error in layout-data API route:', error);
    // Return fallback structure with keys as labels
    return NextResponse.json({
      navLinks: navLinksStructure.map((link) => ({
        label: link.labelKey,
        href: `/${locale}${link.href}`,
      })),
      footerLinks: footerLinksStructure.map((link) => ({
        label: link.labelKey,
        href: `/${locale}${link.href}`,
      })),
    }, { status: 200 }); // Still return 200 so client can handle it
  }
};
