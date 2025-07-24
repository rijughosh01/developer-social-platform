"use client";

import { FiUsers, FiTarget, FiMail } from "react-icons/fi";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="section-fade py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">About DevLink</h1>
          <p className="text-lg text-gray-700 mb-8">
            DevLink is a social platform built for developers to connect, collaborate, and showcase their work. Our mission is to empower developers to grow their network, share knowledge, and build amazing projects together.
          </p>
        </div>
        <div className="mx-auto max-w-4xl px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
            <FiTarget className="h-8 w-8 text-primary-600 mb-2" />
            <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-600">To create a vibrant, inclusive community where developers can learn, grow, and collaborate on impactful projects.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
            <FiUsers className="h-8 w-8 text-green-600 mb-2" />
            <h2 className="text-xl font-semibold mb-2">Our Community</h2>
            <p className="text-gray-600">Thousands of developers from around the world use DevLink to connect, share, and inspire each other every day.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center">
            <FiMail className="h-8 w-8 text-purple-600 mb-2" />
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p className="text-gray-600">Have questions or feedback? Email us at <a href="mailto:pritamghosh20010106@gmail.com" className="text-primary-600 underline">pritamghosh20010106@gmail.com</a></p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-6 mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Meet the Team</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="avatar-ring mb-2">
                <img src="/image.jpg" alt="Pritam Ghosh" className="w-20 h-20 object-cover rounded-full" />
              </div>
              <div className="font-semibold">Pritam Ghosh</div>
              <div className="text-gray-500 text-sm">Full Stack Developer</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 