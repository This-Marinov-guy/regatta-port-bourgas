import { PropertyHomes } from '@/app/types/properyHomes';
import { NextResponse } from 'next/server';

const propertyHomes: PropertyHomes[] = [
  {
    name: 'Serenity Residential Home',
    slug: 'serenity-residential-home',
    category: 'residential-home',
    location: '15 S Aurora Ave, Miami',
    rate: '570,000',
    beds: 4,
    baths: 3,
    area: 120,
    images: [
      { src: "/images/property/property-1/property-cover-1.jpg" },
      { src: "/images/property/property-1/property-1.jpg" },
      { src: "/images/property/property-1/property-2.jpg" },
      { src: "/images/property/property-1/property-3.jpg" }
    ]
  },
  {
    name: 'Mountain View Villa',
    slug: 'mountain-view-villa',
    category: 'luxury-villa',
    location: '18 S Aurora Ave, Miami',
    rate: '575,000',
    beds: 5,
    baths: 2,
    area: 150,
    images: [
      { src: "/images/property/property-2/property-cover-2.jpg" },
      { src: "/images/property/property-2/property-1.jpg" },
      { src: "/images/property/property-2/property-2.jpg" },
      { src: "/images/property/property-2/property-3.jpg" }
    ]
  },
  {
    name: 'Modern Luxe Apartment',
    slug: 'modern-luxe-apartment',
    category: 'apartment',
    location: '20 S Aurora Ave, Miami',
    rate: '580,000',
    beds: 3,
    baths: 4,
    area: 180,
    images: [
      { src: "/images/property/property-3/property-cover-3.jpg" },
      { src: "/images/property/property-3/property-1.jpg" },
      { src: "/images/property/property-3/property-2.jpg" },
      { src: "/images/property/property-3/property-3.jpg" }
    ]
  },
  {
    name: 'Skyline Luxe Apartment',
    slug: 'skyline-luxe-apartment',
    category: 'apartment',
    location: '55 Bayview Drive, San Francisco',
    rate: '610,000',
    beds: 2,
    baths: 2,
    area: 100,
    images: [
      { src: "/images/property/property-4/property-cover-4.jpg" },
      { src: "/images/property/property-4/property-1.jpg" },
      { src: "/images/property/property-4/property-2.jpg" },
      { src: "/images/property/property-4/property-3.jpg" }
    ]
  },
  {
    name: 'Royal Orchid Villa',
    slug: 'royal-orchid-villa',
    category: 'luxury-villa',
    location: '12 Emerald Heights, Los Angeles',
    rate: '590,000',
    beds: 6,
    baths: 3,
    area: 200,
    images: [
      { src: "/images/property/property-5/property-cover-5.jpg" },
      { src: "/images/property/property-5/property-1.jpg" },
      { src: "/images/property/property-5/property-2.jpg" },
      { src: "/images/property/property-5/property-3.jpg" }
    ]
  },
  {
    name: 'Grand Vista Office',
    slug: 'grand-vista-office',
    category: 'office-spaces',
    location: '25 Skyline Boulevard, San Diego',
    rate: '710,000',
    beds: 2,
    baths: 1,
    area: 90,
    images: [
      { src: "/images/property/property-6/property-cover-6.jpg" },
      { src: "/images/property/property-6/property-1.jpg" },
      { src: "/images/property/property-6/property-2.jpg" },
      { src: "/images/property/property-6/property-3.jpg" }
    ]
  },
  {
    name: 'Central Heights Office',
    slug: 'central-heights-office',
    category: 'office-spaces',
    location: '77 Commerce Street, Houston',
    rate: '700,000',
    beds: 3,
    baths: 2,
    area: 140,
    images: [
      { src: "/images/property/property-7/property-cover-7.jpg" },
      { src: "/images/property/property-7/property-1.jpg" },
      { src: "/images/property/property-7/property-2.jpg" },
      { src: "/images/property/property-7/property-3.jpg" }
    ]
  },
  {
    name: 'Imperial Pearl Villa',
    slug: 'imperial-pearl-villa',
    category: 'luxury-villa',
    location: '18 Sapphire Bay Road, Naples',
    rate: '630,000',
    beds: 4,
    baths: 2,
    area: 130,
    images: [
      { src: "/images/property/property-8/property-cover-8.jpg" },
      { src: "/images/property/property-8/property-1.jpg" },
      { src: "/images/property/property-8/property-2.jpg" },
      { src: "/images/property/property-8/property-3.jpg" }
    ]
  },
  {
    name: 'Opulent Haven Apartment',
    slug: 'opulent-haven-apartment',
    category: 'apartment',
    location: '22 Ocean Breeze Drive, Malibu',
    rate: '620,000',
    beds: 6,
    baths: 3,
    area: 180,
    images: [
      { src: "/images/property/property-9/property-cover-9.jpg" },
      { src: "/images/property/property-9/property-1.jpg" },
      { src: "/images/property/property-9/property-2.jpg" },
      { src: "/images/property/property-9/property-3.jpg" }
    ]
  },
  {
    name: 'Elite Crest Office',
    slug: 'elite-crest-office',
    category: 'office-spaces',
    location: '10 Palm View Lane, Beverly Hills',
    rate: '750,000',
    beds: 4,
    baths: 3,
    area: 150,
    images: [
      { src: "/images/property/property-10/property-cover-10.jpg" },
      { src: "/images/property/property-10/property-1.jpg" },
      { src: "/images/property/property-10/property-2.jpg" },
      { src: "/images/property/property-10/property-3.jpg" }
    ]
  },
  {
    name: 'Majestic Residential Home',
    slug: 'majestic-bay-residential-home',
    category: 'residential-home',
    location: '8 Sunset Cove, Miami Beach',
    rate: '680,000',
    beds: 4,
    baths: 2,
    area: 120,
    images: [
      { src: "/images/property/property-11/property-cover-11.jpg" },
      { src: "/images/property/property-11/property-1.jpg" },
      { src: "/images/property/property-11/property-2.jpg" },
      { src: "/images/property/property-11/property-3.jpg" }
    ]
  },
  {
    name: 'Sunset Grove Home',
    slug: 'sunset-grove-home',
    category: 'residential-home',
    location: '90 Maple Leaf Lane, Orlando',
    rate: '540,000',
    beds: 3,
    baths: 2,
    area: 110,
    images: [
      { src: "/images/property/property-12/property-cover-12.jpg" },
      { src: "/images/property/property-12/property-1.jpg" },
      { src: "/images/property/property-12/property-2.jpg" },
      { src: "/images/property/property-12/property-3.jpg" }
    ]
  },
];

export const GET = async () => {
  return NextResponse.json({ propertyHomes });
};
