import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FiCode, FiUsers, FiMessageSquare, FiHeart } from "react-icons/fi";

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-primary-600/10 px-3 py-1 text-sm font-semibold leading-6 text-primary-600 ring-1 ring-inset ring-primary-600/10">
                What's new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-gray-600">
                <span>Just shipped v1.0</span>
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Connect with developers,{" "}
            <span className="text-primary-600">showcase your projects</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            DevLink is the ultimate platform for developers to connect,
            collaborate, and showcase their work. Build your professional
            network, share your projects, and discover amazing developers from
            around the world.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Get started for free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-20">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <FiCode className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Showcase Projects
                  </h3>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Display your best work with detailed descriptions,
                  technologies used, and live demos.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                    <FiUsers className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Build Network
                  </h3>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Connect with like-minded developers, follow your favorites,
                  and grow your professional network.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                    <FiMessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Real-time Chat
                  </h3>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Collaborate seamlessly with instant messaging, file sharing,
                  and group conversations.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
                    <FiHeart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Share Knowledge
                  </h3>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Write articles, share tutorials, and contribute to the
                  developer community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
