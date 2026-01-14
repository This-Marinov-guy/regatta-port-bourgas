import Image from 'next/image'

interface DividerProps {
  className?: string
}

export default function Divider({ className = '' }: DividerProps) {
  return (
    <div className={`relative w-full flex items-center justify-center my-12 md:my-16 lg:my-20 ${className}`}>
      {/* Subtle gradient line behind */}
      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-dark/10 dark:via-white/10 to-transparent" />
      
      {/* Golden rope divider with shadow effect */}
      <div className="relative z-10 px-4 sm:px-8 bg-white dark:bg-black">
        <div className="relative">
          <Image
            src="/images/common/divider.png"
            alt=""
            width={1200}
            height={50}
            className="w-full h-auto max-w-5xl object-contain drop-shadow-sm"
            unoptimized={true}
            aria-hidden="true"
            priority={false}
          />
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
