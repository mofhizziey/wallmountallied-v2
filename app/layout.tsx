import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { DataDebug } from "@/components/data-debug"
import SupportHelpLine from "@/components/SupportHelpLine"
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SecureBank - Your Trusted Banking Partner",
  description: "Experience secure and convenient banking with SecureBank. Manage your finances with confidence.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <SupportHelpLine/>
  {/* {      <DataDebug />} */}
      </body>
    </html>
  )
}
