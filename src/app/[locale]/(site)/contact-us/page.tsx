"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  CLUB_EMAIL,
  CLUB_PHONE,
  MANAGER_EMAIL,
  ADDRESS,
} from "@/utils/defines/CONTACTS";

export default function ContactUs() {
  const t = useTranslations("contactForm");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const reset = () => {
    setFormData({
      name: "",
      mobile: "",
      email: "",
      message: "",
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    fetch("https://formsubmit.co/ajax/bhainirav772@gmail.com", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        message: formData.message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setSubmitted(data.success);
        reset();
      })
      .catch((error) => {
        console.log(error.message);
      });
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [submitted]);

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="mb-12 md:mb-16">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter text-black dark:text-white mb-3 leading-tight sm:leading-10 md:leading-14">
              {t("title")}
            </h3>
          </div>
        </div>

        {/* form */}
        <div className="border border-black/10 dark:border-white/10 rounded-2xl p-3 md:p-4 shadow-xl dark:shadow-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 md:gap-12">
            <div className="relative w-full lg:w-150">
              <Image
                src={"/images/contactUs/contactUs.jpg"}
                alt="wall"
                width={400}
                height={400}
                className="rounded-2xl brightness-50 h-full w-full object-cover"
                unoptimized={true}
              />
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 lg:top-12 lg:left-12 flex flex-col gap-1.5 md:gap-2">
                <h5 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium tracking-tight text-white drop-shadow-lg">
                  {t("contactInfo")}
                </h5>
              </div>
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 md:bottom-8 md:left-8 md:right-auto lg:bottom-12 lg:left-12 flex flex-col gap-2.5 sm:gap-3 md:gap-4 text-white">
                <Link
                  href={`tel:${CLUB_PHONE.replace(/\s/g, "")}`}
                  className="w-full sm:w-fit"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 group">
                    <Icon icon={"ph:phone"} width={18} height={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex-shrink-0" />
                    <p className="text-xs sm:text-sm md:text-base font-normal group-hover:text-primary break-words leading-relaxed">
                      <span className="block sm:inline">{CLUB_PHONE}</span>
                      <span className="hidden sm:inline"> - </span>
                      <span className="block sm:inline">Krasimir Naumov</span>
                    </p>
                  </div>
                </Link>
                <Link href={`mailto:${CLUB_EMAIL}`} className="w-full sm:w-fit">
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 group">
                    <Icon icon={"ph:envelope-simple"} width={18} height={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex-shrink-0" />
                    <p className="text-xs sm:text-sm md:text-base font-normal group-hover:text-primary break-all leading-relaxed">
                      {CLUB_EMAIL}
                    </p>
                  </div>
                </Link>
                <Link href={`mailto:${MANAGER_EMAIL}`} className="w-full sm:w-fit">
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 group">
                    <Icon icon={"ph:envelope-simple"} width={18} height={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex-shrink-0" />
                    <p className="text-xs sm:text-sm md:text-base font-normal group-hover:text-primary break-all leading-relaxed">
                      {MANAGER_EMAIL}
                    </p>
                  </div>
                </Link>
                <Link
                  href={ADDRESS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-fit"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 group">
                    <Icon icon={"ph:map-pin"} width={18} height={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 flex-shrink-0" />
                    <p className="text-xs sm:text-sm md:text-base font-normal group-hover:text-primary leading-relaxed">
                      {t("address")}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex-1 lg:flex-1/2">
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      placeholder={t("namePlaceholder")}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 border border-black/10 dark:border-white/10 rounded-md outline-primary focus:outline w-full text-sm sm:text-base"
                    />
                    <input
                      type="tel"
                      name="mobile"
                      id="mobile"
                      autoComplete="tel"
                      placeholder={t("phonePlaceholder")}
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      className="px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 border border-black/10 dark:border-white/10 rounded-md outline-primary focus:outline w-full text-sm sm:text-base"
                    />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    placeholder={t("emailPlaceholder")}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 border border-black/10 dark:border-white/10 rounded-md outline-primary focus:outline w-full text-sm sm:text-base"
                  />
                  <textarea
                    rows={6}
                    cols={50}
                    name="message"
                    id="message"
                    placeholder={t("messagePlaceholder")}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-3.5 border border-black/10 dark:border-white/10 rounded-2xl outline-primary focus:outline w-full text-sm sm:text-base resize-none"
                  ></textarea>
                  <button className="px-6 py-3 sm:px-7 sm:py-3.5 md:px-8 md:py-4 rounded-md bg-primary text-white text-sm sm:text-base font-semibold w-full sm:w-fit hover:cursor-pointer hover:bg-primary/90 duration-300">
                    {t("sendButton")}
                  </button>
                </div>
                {submitted && (
                  <h5 className="text-primary mt-3 sm:mt-4 text-sm sm:text-base">{t("successMessage")}</h5>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
