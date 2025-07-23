import {
  FiCode,
  FiUsers,
  FiMessageSquare,
  FiHeart,
  FiGithub,
  FiLinkedin,
  FiGlobe,
} from "react-icons/fi";

const features = [
  {
    name: "Developer Profiles",
    description:
      "Create comprehensive profiles showcasing your skills, experience, and projects. Connect your social media and GitHub to build credibility.",
    icon: FiUsers,
  },
  {
    name: "Project Showcase",
    description:
      "Display your projects with detailed descriptions, technologies used, live demos, and GitHub links. Get feedback and recognition from the community.",
    icon: FiCode,
  },
  {
    name: "Real-time Messaging",
    description:
      "Chat with other developers in real-time. Share code snippets, files, and collaborate on projects seamlessly.",
    icon: FiMessageSquare,
  },
  {
    name: "Knowledge Sharing",
    description:
      "Write articles, share tutorials, and contribute to the developer community. Build your reputation as a thought leader.",
    icon: FiHeart,
  },
  {
    name: "GitHub Integration",
    description:
      "Connect your GitHub account to automatically showcase your repositories and contributions.",
    icon: FiGithub,
  },
  {
    name: "Professional Network",
    description:
      "Follow developers you admire, discover new talent, and build meaningful professional relationships.",
    icon: FiLinkedin,
  },
];

export function Features() {
  return (
    <div id="features" className="py-24 bg-gray-50 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            A complete platform for developers
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            DevLink provides everything you need to showcase your work, connect
            with other developers, and grow your professional network in one
            comprehensive platform.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon
                    className="h-5 w-5 flex-none text-primary-600"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
