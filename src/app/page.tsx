import Services from './components/home/services'
import Hero from './components/home/hero'
import Properties from './components/home/properties'
import FeaturedProperty from './components/home/featured-property'
import Testimonial from './components/home/testimonial'
import BlogSmall from './components/shared/blog'
import GetInTouch from './components/home/get-in-touch'
import FAQ from './components/home/faqs'

export default function Home() {
  return (
    <main>
      <Hero />
      <Services />
      <Properties />
      <FeaturedProperty />
      <Testimonial />
      <BlogSmall />
      <GetInTouch />
      <FAQ />
    </main>
  )
}
