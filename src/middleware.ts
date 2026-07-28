import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import {
  CLIENT_MANUAL_LOCALE_COOKIE,
  CLIENT_LOCALE_COOKIE,
  CLIENT_REGION_COOKIE,
  isAppLocale,
} from './lib/locale';

const intlMiddleware = createMiddleware(routing);

function getCountryCode(request: Request) {
  return (
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    ''
  ).trim().toUpperCase();
}

function getCookie(request: Request, name: string) {
  return request.headers.get('cookie')?.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)`),
  )?.[1];
}

function getServerLocale(request: Request) {
  const manualLocale = getCookie(request, CLIENT_MANUAL_LOCALE_COOKIE);
  if (isAppLocale(manualLocale)) {
    return { locale: manualLocale, countryCode: 'MANUAL' } as const;
  }

  const countryCode = getCountryCode(request);
  if (countryCode) {
    return {
      locale: countryCode === 'BG' ? 'bg' : 'en',
      countryCode,
    } as const;
  }

  const cachedCountryCode = getCookie(request, CLIENT_REGION_COOKIE)?.toUpperCase();
  if (cachedCountryCode && cachedCountryCode !== 'UNKNOWN') {
    return {
      locale: cachedCountryCode === 'BG' ? 'bg' : 'en',
      countryCode: cachedCountryCode,
    } as const;
  }

  const acceptLanguage = request.headers.get('accept-language') || '';
  const locale = /(?:^|,|-)bg(?:-|,|;|$)/i.test(acceptLanguage) ? 'bg' : 'en';
  const savedLocale = getCookie(request, CLIENT_LOCALE_COOKIE);

  return {
    locale: isAppLocale(savedLocale) ? savedLocale : locale,
    countryCode: 'UNKNOWN',
  } as const;
}

export default function middleware(request: Parameters<typeof intlMiddleware>[0]) {
  if (request.nextUrl.pathname === '/') {
    const { locale, countryCode } = getServerLocale(request);
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}`;

    const response = NextResponse.redirect(target, 307);
    response.cookies.set(CLIENT_LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    if (countryCode !== 'MANUAL') {
      response.cookies.set(CLIENT_REGION_COOKIE, countryCode, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
      });
    }
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(bg|en)/:path*']
};
