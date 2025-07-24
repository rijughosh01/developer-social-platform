"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-600">
                DevLink
              </span>
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              Features
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              Testimonials
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600"
            >
              About
            </Link>
          </div>
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
        </nav>
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
