import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/ui/navbar'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Carvaan Go - Carpooling at its best',
  description: 'Your pick of rides at low prices',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <ClerkProvider signInUrl="/auth" signUpUrl="/auth?mode=sign-up" afterSignOutUrl="/">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </ClerkProvider>
      </body>
    </html>
  )
}
