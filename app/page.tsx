"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Menu, X, Landmark, ShieldCheck, Lock, Fingerprint, CheckCircle, ArrowRight, Phone, PhoneOff, AlertTriangle, User } from "lucide-react"

const transitionProps = { duration: 0.6, ease: [0.42, 0, 0.58, 1] }
const viewportProps = { once: true, amount: 0.3 }

// Voicemail Popup Component
const VoicemailPopup = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Popup Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with failed call indicator */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <PhoneOff className="h-8 w-8 text-white" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-300 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-3 w-3 text-red-700" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Call Failed</h3>
                      <p className="text-red-100 text-sm">Connection unavailable</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Animated signal waves */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-400">
                  <motion.div
                    className="h-full bg-red-200"
                    animate={{ scaleX: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Caller Info */}
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">WallmountAlliedBank</p>
                    <p className="text-sm text-gray-500">Support Helpline</p>
                  </div>
                </div>

                {/* Failed message display */}
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-800 font-medium mb-1">Helpline Unavailable</h4>
                      <p className="text-red-700 text-sm leading-relaxed">
                        Our support helpline is currently not available. Please contact the administrator for immediate assistance.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Call details */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number:</span>
                    <span className="font-mono text-gray-900">+757 699-4478</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time:</span>
                    <span className="text-gray-900">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-red-600 font-medium">Failed</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={onClose}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Contact Admin
                  </Button>
                </div>

                {/* Footer note */}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    For urgent matters, please use our online support portal
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [showVoicemailPopup, setShowVoicemailPopup] = useState(false)

  const navigation = [{ name: "Features", href: "#features" }]

  const clientLogos = [
    { name: "JPMorgan", src: "/placeholder.svg?height=48&width=80&text=JPMorgan" },
    { name: "Goldman Sachs", src: "/placeholder.svg?height=48&width=80&text=Goldman" },
    { name: "Wells Fargo", src: "/placeholder.svg?height=48&width=80&text=Wells" },
    { name: "Bank of America", src: "/placeholder.svg?height=48&width=80&text=BofA" },
  ]

  const announcements = [
    {
      image:
        "https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop",
      author: "Rahmed Ka",
      date: "21 Jul 2023",
      title: "Wise Spending Habits, 13 Tips for Maximizing Your Money.",
    },
  ]

  const handleContactClick = (e) => {
    e.preventDefault()
    setShowVoicemailPopup(true)
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Navbar */}
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">WallmountAlliedBank</span>
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700">Open Account</Button>
                </Link>
              </div>
              <div className="md:hidden">
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            {isOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="pt-4 space-y-2">
                    <Link href="/login" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Open Account</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        <main className="pt-16">
          {/* Hero Section */}
          <motion.section
            id="hero"
            className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-blue-50 to-white relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitionProps}
          >
            <Image
              src="https://images.pexels.com/photos/302769/pexels-photo-302769.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
              alt="Modern banking interior"
              fill
              className="absolute inset-0 z-0 opacity-20 object-cover"
            />
            <div className="container mx-auto px-4 md:px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight text-gray-900 font-serif">
                    All Banking Needs
                  </h1>
                  <p className="max-w-[500px] text-lg md:text-xl text-gray-700">
                    Experience seamless financial management with WallmountAlliedBank. We provide comprehensive solutions
                    tailored to your needs, ensuring security and convenience.
                  </p>
                  <div className="w-32 h-12 bg-blue-700 rounded-md shadow-lg flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-blue-800 transition-colors">
                    <Link href="/signup">Get Started</Link>
                  </div>
                </div>
                <div className="space-y-6 text-right lg:text-left">
                  <p className="text-lg md:text-xl text-gray-700">
                    <span className="underline font-semibold text-blue-700">Over 90+ countries</span> using our service
                    without any hassle.
                  </p>
                  <div className="text-7xl md:text-8xl lg:text-9xl font-bold text-blue-700">1.75m</div>
                  <p className="text-lg md:text-xl text-gray-700">Total Active users</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Features Section */}
          <motion.section
            id="features"
            className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-white to-blue-50/50 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <Image
              src="https://images.pexels.com/photos/7821929/pexels-photo-7821929.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
              alt="Digital banking technology"
              fill
              className="absolute inset-0 z-0 opacity-10 object-cover"
            />
            <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900 font-serif">
                  Our Featured products.
                </h2>
                <p className="max-w-[500px] text-lg md:text-xl text-gray-700">
                  Discover a suite of innovative financial products designed to empower your journey towards financial
                  freedom and growth.
                </p>
                <Link
                  href="#"
                  className="flex items-center space-x-2 text-lg font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                >
                  <span>All Services</span>
                  <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Agent Banking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Empower your business with our Agent Banking solutions. Manage transactions, facilitate deposits,
                      and withdrawals efficiently, extending financial services to your community.
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Savings Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Grow your wealth securely with our high-yield Savings Accounts. Enjoy competitive interest rates,
                      easy access to funds, and robust security features for your peace of mind.
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Current Account</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Manage your daily transactions with ease. Our Current Accounts offer flexibility, overdraft
                      facilities, and seamless digital banking for your business or personal needs.
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900">Fixed Deposit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Secure your future with our Fixed Deposit accounts. Lock in attractive interest rates for a fixed
                      term and watch your savings grow with guaranteed returns.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>

          {/* Create Account Section */}
          <motion.section
            id="create-account"
            className="w-full py-12 md:py-24 lg:py-32 bg-emerald-50 relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <Image
              src="https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop"
              alt="Banking customer service and digital banking"
              fill
              className="absolute inset-0 z-0 opacity-20 object-cover"
            />
            <div className="container mx-auto px-4 md:px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-96 w-full bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg overflow-hidden flex items-center justify-center shadow-xl">
                <Image
                  src="https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                  alt="Banking account opening process"
                  fill
                  className="opacity-60 object-cover"
                />
                <div className="relative z-10 p-8 text-center bg-white/90 rounded-lg backdrop-blur-sm">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Seamless Onboarding</h3>
                  <p className="text-lg text-gray-700">
                    Open your account in minutes, fully online, with minimal hassle.
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900">
                  Create An Account today.
                </h2>
                <p className="max-w-[500px] text-lg md:text-xl text-gray-700">
                  Control of all your banking needs anywhere, anytime.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-700 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">Compare different insurance items</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-700 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">Buy, store and share all your policies online</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-blue-700 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">Email & Live chat support</p>
                  </li>
                </ul>
                <div className="flex items-center space-x-3 pt-4">
                  <div className="w-6 h-6 bg-black rounded-full" />
                  <span className="text-lg font-semibold text-gray-900">Registered Wallmount Allied</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Security Section */}
          <motion.section
            id="security"
            className="w-full py-12 md:py-24 lg:py-32 bg-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tighter text-gray-900 mb-8">
                Your Security, Our Priority
              </h2>
              <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-700 mb-12">
                We employ industry-leading security measures to protect your financial information and ensure peace of
                mind.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-blue-50/30 shadow-md">
                  <ShieldCheck className="h-12 w-12 text-blue-700" />
                  <h3 className="text-xl font-semibold text-gray-900">Advanced Encryption</h3>
                  <p className="text-gray-700">
                    We utilize cutting-edge encryption technologies to safeguard your personal and financial data,
                    ensuring maximum privacy and protection.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-blue-50/30 shadow-md">
                  <Lock className="h-12 w-12 text-blue-700" />
                  <h3 className="text-xl font-semibold text-gray-900">Fraud Protection</h3>
                  <p className="text-gray-700">
                    Our dedicated team and advanced systems work tirelessly 24/7 to detect and prevent fraudulent
                    activities, providing an impenetrable shield for your assets.
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-blue-50/30 shadow-md">
                  <Fingerprint className="h-12 w-12 text-blue-700" />
                  <h3 className="text-xl font-semibold text-gray-900">Secure Authentication</h3>
                  <p className="text-gray-700">
                    Access your accounts with confidence using our multi-layered authentication methods, including
                    biometric options and secure passcodes, for unparalleled security.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Wealth Management Section */}
          <motion.section
            id="wealth-management"
            className="w-full py-12 md:py-24 lg:py-32 bg-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900 text-center mb-12">
                We&apos;re here to help you build, manage & protect your wealth.
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-2xl font-bold text-gray-900">Mutual Funds.</CardTitle>
                    <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center shadow-md" />
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Mutual funds enable collective investment, managed by professionals for potential growth. Diversify
                      your portfolio and achieve your financial goals with expert guidance.
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-lg border-none hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-2xl font-bold text-gray-900">Pension Scheme.</CardTitle>
                    <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center shadow-md" />
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-700">
                      Pension schemes ensure financial security during retirement years for eligible individuals.
                      Retirement pensions provide financial security for qualifying individuals, allowing you to plan for
                      a comfortable future.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>

          {/* Client Testimonials Section */}
          <motion.section
            id="client-testimonials"
            className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-white to-gray-50"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="bg-gray-900 text-white p-4 rounded-lg inline-block mb-4 shadow-lg">
                  <div className="text-3xl font-bold">4.8</div>
                  <div className="text-sm text-gray-400">avg rating</div>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900 font-serif">
                  Find our Customers kind Words.
                </h2>
                <p className="max-w-[500px] text-lg md:text-xl text-gray-700">
                  Quick solutions coupled with extraordinary performance—a recommendation that&apos;s unequivocal.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-900 rounded-full" />
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                </div>
              </div>
              <div className="space-y-8">
                <p className="text-lg md:text-xl text-gray-700">
                  <span className="underline font-semibold text-blue-700">150,000+</span> Client all over the world.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-center">
                  {clientLogos.map((logo, index) => (
                    <div key={index} className="relative w-20 h-12 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={logo.src || "/placeholder.svg"}
                        alt={logo.name}
                        fill
                        className="opacity-70 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Impact Statistics Section */}
          <motion.section
            id="impact-statistics"
            className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50/50 to-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg">
                    <Image
                      src="https://images.pexels.com/photos/7821931/pexels-photo-7821931.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
                      alt="Musa Jamy - CEO"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-900">Musa Jamy.</p>
                    <p className="text-lg text-gray-700">CEO & Head of Wallmount Group.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900">
                  <span className="underline text-blue-700">7.42m+</span> clients trust WallmountAlliedBank for
                  unparalleled banking excellence. We deliver reliable services, customer-centric solutions, and a
                  steadfast legacy of financial integrity.
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-12">
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-700">120+</div>
                    <p className="text-gray-700">Global Partners</p>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-700">$1.3b+</div>
                    <p className="text-gray-700">Total Assets Under Management</p>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-700">705k</div>
                    <p className="text-gray-700">Satisfied Customers</p>
                  </div>
                  <div>
                    <div className="text-4xl md:text-5xl font-bold text-blue-700">$1.2%</div>
                    <p className="text-gray-700">Annual Growth Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Announcements Section */}
          <motion.section
            id="announcements"
            className="w-full py-12 md:py-24 lg:py-32 bg-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900 mb-4">
                Announcement.
              </h2>
              <p className="text-lg md:text-xl text-gray-700 mb-12">
                Get the latest update, tips & tricks from our expert.
              </p>
              <div className="grid md:grid-cols-2 gap-8">
                {announcements.map((announcement, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-50 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: [0.42, 0, 0.58, 1] }}
                  >
                    <Image
                      src={announcement.image || "/placeholder.svg"}
                      alt={announcement.title}
                      width={600}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{announcement.author}</span>
                        <span>{announcement.date}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 leading-snug">
                        <Link href="#" className="hover:text-blue-700 transition-colors">
                          {announcement.title}
                        </Link>
                      </h3>
                      <Link
                        href="#"
                        className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 text-sm font-medium"
                      >
                        <span>Read More</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            id="cta"
            className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-white to-yellow-50"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="https://images.pexels.com/photos/5668791/pexels-photo-5668791.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
                  alt="Banking team collaboration"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="bg-yellow-50 p-8 md:p-12 rounded-lg space-y-6 shadow-lg">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900">
                  Let&apos;s get started It&apos;s simple.
                </h2>
                <p className="text-lg md:text-xl text-gray-700">
                  Join thousands of satisfied customers who experience effortless banking. Our platform is designed for
                  simplicity, security, and efficiency, making your financial journey smooth and rewarding.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">Intuitive mobile app for easy account management & access</p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">
                      Comprehensive features to handle all your banking needs effortlessly
                    </p>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <p className="text-lg text-gray-800">
                      Robust and reliable security systems to protect your investments
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Newsletter Section */}
          <motion.section
            id="newsletter"
            className="w-full py-12 md:py-24 lg:py-32 bg-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportProps}
            transition={transitionProps}
          >
            <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight text-gray-900 mb-4">
                Our Newsletter.
              </h2>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                Get instant news by subscribe to our daily newsletter
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto items-center">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 p-3 rounded-md bg-gray-100 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-300 border-none shadow-sm"
                />
                <Button className="bg-blue-700 text-white hover:bg-blue-800 font-semibold py-3 px-6 rounded-md transition-colors flex items-center gap-2">
                  Subscribe <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Already Subscribed?{" "}
                <Link href="#" className="text-blue-700 hover:underline font-medium">
                  Manage Subscription
                </Link>
              </p>
            </div>
          </motion.section>
        </main>

        {/* Footer */}
        <footer className="w-full py-12 md:py-16 border-t bg-gray-900 text-gray-300">
          <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center md:items-start space-y-4">
              <div className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center shadow-lg">
                <Phone className="h-12 w-12 text-blue-900" />
              </div>
              <p className="text-center md:text-left text-sm">
                2192 Urban Terrace, Mirpur. <br /> Licensed in 50 states.
              </p>
              <button
                onClick={handleContactClick}
                className="text-xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
              >
                +757 699-4478
              </button>
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-lg font-semibold text-white mb-2">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Product
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Our services
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Features
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h3 className="text-lg font-semibold text-white mb-2">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    Announcement
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-400 transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={handleContactClick}
                    className="hover:text-blue-400 transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-center md:items-end space-y-4 md:col-span-3 lg:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">WallmountAlliedBank</span>
              </div>
              <p className="text-sm text-gray-500 text-center md:text-right">
                &copy; {new Date().getFullYear()} WallmountAlliedBank. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Voicemail Popup */}
      <VoicemailPopup isOpen={showVoicemailPopup} onClose={() => setShowVoicemailPopup(false)} />
    </>
  )
}