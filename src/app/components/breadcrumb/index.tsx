import React, { FC } from 'react';
import Link from 'next/link';

interface BreadcrumbProps {
    links: { href: string; text: string }[];
    image?: string;
}

const Breadcrumb: FC<BreadcrumbProps> = ({ links, image }) => {
    const lastIndex = links.length - 1;

    const nav = (
        <div className="flex items-baseline flex-wrap justify-center my-[0.9375rem] mx-0">
            {links.map((link, index) => (
                <React.Fragment key={index}>
                    {index !== lastIndex ? (
                        <Link href={link.href} className="no-underline flex items-center text-midnight_text dark:text-white dark:text-opacity-70 text-SkyMistBlue font-normal text-xl hover:underline after:relative after:content-[''] after:ml-2.5 after:mr-3 after:my-0 after:inline-block after:top-[0.0625rem] after:w-2 after:h-2 after:border-r-2 after:border-solid after:border-b-2 after:border-midnight_text dark:after:border-white after:-rotate-45">
                            {link.text}
                        </Link>
                    ) : (
                        <span className="dark:text-white text-midnight_text text-xl mx-2.5">{link.text}</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    if (!image) {
        return nav;
    }

    return (
      <div
        className="relative -mx-5 2xl:-mx-0 -mt-32 md:-mt-44 mb-10 md:mb-14 overflow-hidden"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottomLeftRadius: '300px',
          borderBottomRightRadius: '300px',
        }}
      >
        <div className="absolute inset-0 bg-dark/55" />
        <div className="relative container max-w-8xl mx-auto px-5 2xl:px-0 pt-48 md:pt-60 pb-14 md:pb-20 flex flex-col items-center text-center">
          <div className="flex items-baseline flex-wrap justify-center mx-0">
            {links.map((link, index) => (
              <React.Fragment key={index}>
                {index !== lastIndex ? (
                  <Link
                    href={link.href}
                    className="no-underline flex items-center text-white/70 font-normal text-xl hover:text-white after:relative after:content-[''] after:ml-2.5 after:mr-3 after:my-0 after:inline-block after:top-[0.0625rem] after:w-2 after:h-2 after:border-r-2 after:border-solid after:border-b-2 after:border-white/70 after:-rotate-45"
                  >
                    {link.text}
                  </Link>
                ) : (
                  <span className="text-white text-xl mx-2.5">{link.text}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
};

export default Breadcrumb;
