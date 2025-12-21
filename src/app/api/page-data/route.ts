import { FeaturedProperty } from '@/app/types/featuredProperty'
import { Testimonial } from "@/app/types/testimonial"
import { NextResponse } from 'next/server';

const featuredProprty: FeaturedProperty[] = [
  {
    scr: '/images/featuredproperty/image-1.jpg',
    alt: 'property6',
  },
  {
    scr: '/images/featuredproperty/image-2.jpg',
    alt: 'property7',
  },
  {
    scr: '/images/featuredproperty/image-3.jpg',
    alt: 'property8',
  },
  {
    scr: '/images/featuredproperty/image-4.jpg',
    alt: 'property9',
  },
]

const testimonials: Testimonial[] = [
    {
        image: '/images/testimonial/smiths.jpg',
        name: 'Emily & John Smith',
        review: 'I found my ideal home in no time! The listings were detailed, the photos were accurate, and the whole process felt seamless. Customer service was top-notch, answering all my questions. I will definitely use this platform again in the future!',
        position: 'Buyer'
    },
    {
        image: '/images/testimonial/johns.jpg',
        name: 'Sam & Mickay John',
        review: 'I quickly found my dream home! The listings were thorough, the photos were spot-on, and the entire process was smooth. The customer service was outstanding, addressing all my questions with ease. I’ll definitely use this platform again!',
        position: 'Buyer'
    },
]

export const GET = async () => {
  return NextResponse.json({
    featuredProprty,
    testimonials
  });
};