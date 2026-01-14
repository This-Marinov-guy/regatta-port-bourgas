import Hero from '../components/home/hero'
import Partners from '../components/home/partners'
import ContactForm from '../components/home/contact-form'
import EventsPreview from '../components/home/events-preview'

export default function Home() {
  return (
    <main>
      <Hero />
      {/* <Services /> */}
      <Partners />
      <EventsPreview />
      {/* <Testimonial /> */}
      {/* <GetInTouch /> */}
      <ContactForm />
      {/* <FAQ /> */}
      {/* <ContactPanel /> */}
    </main>
  )
}

