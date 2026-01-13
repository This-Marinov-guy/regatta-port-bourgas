import Services from '../components/home/services'
import Hero from '../components/home/hero'
import Testimonial from '../components/home/testimonial'
import GetInTouch from '../components/home/get-in-touch'
import FAQ from '../components/home/faqs'
import Partners from '../components/home/partners'
import ContactForm from '../components/home/contact-form'

export default function Home() {
  return (
    <main>
      <Hero />
      {/* <Services /> */}
      <Partners />
      {/* <Testimonial /> */}
      {/* <GetInTouch /> */}
      <ContactForm />
      {/* <FAQ /> */}
      {/* <ContactPanel /> */}
    </main>
  )
}

