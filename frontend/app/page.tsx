"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Testimonials } from "@/components/testimonials";
import { Footer } from "@/components/footer";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useEffect, useState } from "react";
import { CommunityStats } from "@/components/community/CommunityStats";
import { PersonalizedWelcome } from "@/components/community/PersonalizedWelcome";
import { TrendingPreview } from "@/components/community/TrendingPreview";
import { RecentActivityFeed } from "@/components/community/RecentActivityFeed";
import { HowItWorks } from "@/components/community/HowItWorks";
import { FiMenu, FiX } from "react-icons/fi";

export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:p-6 lg:px-8">
          {/* Logo Section */}
          <div className="flex lg:flex-1">
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl p-3 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute top-6 right-3 w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-0.75 h-0.75 bg-white rounded-full"></div>
                <div className="absolute bottom-8 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>
              <Logo variant="compact" className="relative z-10" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:gap-x-12">
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors duration-200"
            >
              Testimonials
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600 transition-colors duration-200"
            >
              About
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
            {mounted && isAuthenticated ? (
              <Link href="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeMobileMenu}
            />
            
            <div className="fixed inset-y-0 right-0 flex w-80 max-w-xs flex-col bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full"></div>
                  <div className="absolute top-6 right-3 w-0.5 h-0.5 bg-white rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-0.75 h-0.75 bg-white rounded-full"></div>
                  <div className="absolute bottom-8 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
                </div>
                
                <Logo variant="compact" className="relative z-10" />
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 relative z-10"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <Link
                  href="#features"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  Testimonials
                </Link>
                <Link
                  href="/about"
                  className="flex items-center px-4 py-3 text-base font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                  onClick={closeMobileMenu}
                >
                  About
                </Link>
              </nav>

              <div className="p-4 border-t border-gray-200">
                {mounted && isAuthenticated ? (
                  <Link href="/dashboard" onClick={closeMobileMenu}>
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link href="/auth/login" onClick={closeMobileMenu}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/auth/register" onClick={closeMobileMenu}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Personalized Welcome Section */}
      <div className="section-fade">
        <PersonalizedWelcome />
      </div>

      {/* Hero Section */}
      <div className="section-fade">
        <Hero />
      </div>

      {/* Community Stats Section */}
      <div className="section-fade">
        <CommunityStats />
      </div>

      {/* Trending Preview Section */}
      <div className="section-fade">
        <TrendingPreview />
      </div>

      {/* Recent Activity Feed Section */}
      <div className="section-fade">
        <RecentActivityFeed />
      </div>

      {/* Features Section */}
      <div className="section-fade">
        <Features />
      </div>

      {/* How It Works Section */}
      <div className="section-fade">
        <HowItWorks />
      </div>

      {/* Testimonials Section */}
      <div className="section-fade">
        <Testimonials />
      </div>

      {/* CTA Section */}
      <div className="section-fade">
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ready to join the developer community?
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Start building your developer profile, showcase your projects, and
                connect with like-minded developers today.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {mounted && isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg">Go to Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/register">
                      <Button size="lg">Get Started for Free</Button>
                    </Link>
                    <Link href="/auth/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
