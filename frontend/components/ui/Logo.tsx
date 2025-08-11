import Link from "next/link";
import { FiLink } from "react-icons/fi";

interface LogoProps {
  variant?: "default" | "compact" | "sidebar";
  className?: string;
  showTagline?: boolean;
  onClick?: () => void;
}

export function Logo({ variant = "default", className = "", showTagline = true, onClick }: LogoProps) {
  const baseClasses = "cursor-pointer hover:opacity-90 transition-all duration-300 group";
  
  const variants = {
    default: "flex items-center",
    compact: "flex items-center",
    sidebar: "flex items-center"
  };

  const iconSizes = {
    default: "w-12 h-12",
    compact: "w-8 h-8", 
    sidebar: "w-10 h-10"
  };

  const textSizes = {
    default: "text-2xl",
    compact: "text-lg",
    sidebar: "text-xl"
  };

  const taglineSizes = {
    default: "text-xs",
    compact: "text-xs",
    sidebar: "text-xs"
  };

  return (
    <Link href="/" className={`${baseClasses} ${variants[variant]} ${className}`} onClick={onClick}>
      {/* Icon Container */}
      <div className={`${iconSizes[variant]} bg-white rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300 shadow-xl group-hover:shadow-2xl`}>
        <div className="relative">
          <FiLink className={`${variant === "compact" ? "w-4 h-4" : variant === "sidebar" ? "w-5 h-5" : "w-6 h-6"} text-primary-600`} />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full border border-white"></div>
        </div>
      </div>
      
      {/* Brand Text */}
      <div>
        <h1 className={`${textSizes[variant]} font-bold text-white tracking-tight group-hover:text-blue-100 transition-colors duration-300`}>
          DevLink
        </h1>
        {showTagline && (
          <div className={`${taglineSizes[variant]} text-primary-100 font-medium tracking-wide`}>
            Connect • Collaborate • Code
          </div>
        )}
      </div>
    </Link>
  );
}
