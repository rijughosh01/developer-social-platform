import { FiStar } from "react-icons/fi";

const testimonials = [
  {
    body: "DevLink has completely transformed how I showcase my projects. The community is incredibly supportive and I've connected with developers from around the world.",
    author: {
      name: "Sarah Chen",
      handle: "Full Stack Developer",
      imageUrl:
        "https://ui-avatars.com/api/?name=Sarah+Chen&background=3b82f6&color=fff&size=128",
    },
  },
  {
    body: "As a junior developer, DevLink has been invaluable for networking and learning from experienced developers. The real-time chat feature makes collaboration seamless.",
    author: {
      name: "Marcus Rodriguez",
      handle: "Frontend Developer",
      imageUrl:
        "https://ui-avatars.com/api/?name=Marcus+Rodriguez&background=10b981&color=fff&size=128",
    },
  },
  {
    body: "I love how easy it is to showcase my projects and get feedback from the community. The GitHub integration is a game-changer for my portfolio.",
    author: {
      name: "Emily Johnson",
      handle: "Backend Engineer",
      imageUrl:
        "https://ui-avatars.com/api/?name=Emily+Johnson&background=f59e0b&color=fff&size=128",
    },
  },
];

export function Testimonials() {
  return (
    <div id="testimonials" className="py-24 bg-white sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-primary-600">
            Testimonials
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by developers worldwide
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, testimonialIdx) => (
              <div key={testimonialIdx} className="card p-8">
                <div className="flex items-center gap-x-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="mt-8 text-gray-900">
                  <p className="text-lg leading-8">{testimonial.body}</p>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-x-4">
                  <img
                    className="h-10 w-10 rounded-full bg-gray-50"
                    src={testimonial.author.imageUrl}
                    alt=""
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author.name}
                    </div>
                    <div className="text-gray-600">
                      {testimonial.author.handle}
                    </div>
                  </div>
                </figcaption>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
