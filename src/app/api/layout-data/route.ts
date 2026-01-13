import { NextResponse } from "next/server";

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/properties' },
  { label: 'Blog', href: '/blogs' },
  { label: 'Contact', href: '/contact-us' },
  { label: 'Docs', href: '/documentation' },
]

const footerLinks = [
    { label: 'Luxury Villas', href: '/properties?category=luxury-villa' },
    { label: 'Residential Homes', href: '/properties?category=residential-home' },
    { label: 'Apartments', href: '/properties?category=apartment' },
    { label: 'Contact Us', href: '/contact-us' },
    { label: 'Blog', href: '/blogs' },
    { label: '404 Page', href: '/not-found' },
    { label: 'Documentation', href: '/documentation' },
]

export const GET = async () => {
  return NextResponse.json({
    navLinks,
    footerLinks
  });
};
