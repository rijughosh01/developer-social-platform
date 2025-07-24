"use client";

import { FiUserPlus, FiUploadCloud, FiUsers } from "react-icons/fi";

export function HowItWorks() {
  const steps = [
    {
      icon: <FiUserPlus className="h-8 w-8 text-primary-600" />,
      title: "Create Your Profile",
      description:
        "Sign up and build a developer profile that highlights your skills, experience, and interests.",
    },
    {
      icon: <FiUploadCloud className="h-8 w-8 text-green-600" />,
      title: "Share Your Projects",
      description:
        "Showcase your best work, add descriptions, tech stacks, and get feedback from the community.",
    },
    {
      icon: <FiUsers className="h-8 w-8 text-purple-600" />,
      title: "Connect & Collaborate",
      description:
        "Find like-minded developers, join projects, chat, and grow your professional network.",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="bg-white rounded-xl shadow p-8 flex flex-col items-center transition-transform hover:scale-105"
            >
              <div className="mb-4">{step.icon}</div>
              <div className="text-xl font-semibold text-gray-900 mb-2">
                {idx + 1}. {step.title}
              </div>
              <div className="text-gray-600">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
