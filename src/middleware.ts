import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import {
  CLIENT_LOCALE_COOKIE,
  isAppLocale,
  type AppLocale,
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

function getServerLocale(request: Request): AppLocale {
  const savedLocale = request.headers.get('cookie')?.match(
    new RegExp(`(?:^|;\\s*)${CLIENT_LOCALE_COOKIE}=([^;]+)`),
  )?.[1];

  if (isAppLocale(savedLocale)) {
    return savedLocale;
  }

  if (getCountryCode(request) === 'BG') {
    return 'bg';
  }

  const acceptLanguage = request.headers.get('accept-language') || '';
  return /(?:^|,|-)bg(?:-|,|;|$)/i.test(acceptLanguage) ? 'bg' : 'en';
}

export default function middleware(request: Parameters<typeof intlMiddleware>[0]) {
  if (request.nextUrl.pathname === '/') {
    const locale = getServerLocale(request);
    const target = request.nextUrl.clone();
    target.pathname = `/${locale}`;

    const response = NextResponse.redirect(target, 307);
    response.cookies.set(CLIENT_LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(bg|en)/:path*']
};
