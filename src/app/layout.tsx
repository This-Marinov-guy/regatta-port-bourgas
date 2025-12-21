// Root layout - Next.js requires this but next-intl handles the actual layout in [locale]
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

