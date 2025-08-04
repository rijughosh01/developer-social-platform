"use client";

import React from "react";
import {
  FiCode,
  FiGlobe,
  FiSmartphone,
  FiDatabase,
  FiPackage,
  FiTool,
  FiFolder,
} from "react-icons/fi";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  defaultTechnologies: string[];
  defaultTags: string[];
  template: {
    title: string;
    description: string;
    shortDescription: string;
    category: string;
    status: string;
    technologies: string[];
    tags: string[];
  };
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "react-web-app",
    name: "React Web App",
    description: "Modern web application built with React",
    icon: <FiGlobe className="w-6 h-6" />,
    category: "web",
    defaultTechnologies: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
    defaultTags: ["web", "frontend", "react"],
    template: {
      title: "My React Web App",
      description:
        "A modern web application built with React, featuring responsive design and modern UI components. This project demonstrates best practices in React development including hooks, context, and component composition.",
      shortDescription: "Modern React web application with responsive design",
      category: "web",
      status: "completed",
      technologies: ["React", "TypeScript", "Tailwind CSS", "Node.js"],
      tags: ["web", "frontend", "react"],
    },
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "Cross-platform mobile application",
    icon: <FiSmartphone className="w-6 h-6" />,
    category: "mobile",
    defaultTechnologies: ["React Native", "Expo", "Firebase"],
    defaultTags: ["mobile", "cross-platform", "react-native"],
    template: {
      title: "My Mobile App",
      description:
        "A cross-platform mobile application built with React Native and Expo. Features include user authentication, real-time data synchronization, and native device capabilities.",
      shortDescription: "Cross-platform mobile app with React Native",
      category: "mobile",
      status: "in-progress",
      technologies: ["React Native", "Expo", "Firebase"],
      tags: ["mobile", "cross-platform", "react-native"],
    },
  },
  {
    id: "api-backend",
    name: "API Backend",
    description: "RESTful API with Node.js and Express",
    icon: <FiDatabase className="w-6 h-6" />,
    category: "api",
    defaultTechnologies: ["Node.js", "Express", "MongoDB", "JWT"],
    defaultTags: ["api", "backend", "nodejs"],
    template: {
      title: "My API Backend",
      description:
        "A robust RESTful API built with Node.js and Express. Features include user authentication, data validation, error handling, and comprehensive documentation.",
      shortDescription: "RESTful API with Node.js and Express",
      category: "api",
      status: "completed",
      technologies: ["Node.js", "Express", "MongoDB", "JWT"],
      tags: ["api", "backend", "nodejs"],
    },
  },
  {
    id: "desktop-app",
    name: "Desktop App",
    description: "Cross-platform desktop application",
    icon: <FiCode className="w-6 h-6" />,
    category: "desktop",
    defaultTechnologies: ["Electron", "React", "TypeScript"],
    defaultTags: ["desktop", "electron", "cross-platform"],
    template: {
      title: "My Desktop App",
      description:
        "A cross-platform desktop application built with Electron and React. Provides native desktop experience with web technologies.",
      shortDescription: "Cross-platform desktop app with Electron",
      category: "desktop",
      status: "in-progress",
      technologies: ["Electron", "React", "TypeScript"],
      tags: ["desktop", "electron", "cross-platform"],
    },
  },
  {
    id: "library-package",
    name: "Library/Package",
    description: "Reusable code library or npm package",
    icon: <FiPackage className="w-6 h-6" />,
    category: "library",
    defaultTechnologies: ["TypeScript", "Rollup", "Jest"],
    defaultTags: ["library", "npm", "typescript"],
    template: {
      title: "My Library",
      description:
        "A reusable JavaScript/TypeScript library designed to solve common development problems. Features comprehensive testing, documentation, and TypeScript support.",
      shortDescription: "Reusable JavaScript/TypeScript library",
      category: "library",
      status: "completed",
      technologies: ["TypeScript", "Rollup", "Jest"],
      tags: ["library", "npm", "typescript"],
    },
  },
  {
    id: "development-tool",
    name: "Development Tool",
    description: "Tool to improve development workflow",
    icon: <FiTool className="w-6 h-6" />,
    category: "tool",
    defaultTechnologies: ["Node.js", "Commander.js", "Chalk"],
    defaultTags: ["tool", "cli", "productivity"],
    template: {
      title: "My Development Tool",
      description:
        "A command-line tool designed to improve development workflow and productivity. Automates repetitive tasks and provides helpful utilities for developers.",
      shortDescription: "CLI tool for development workflow",
      category: "tool",
      status: "completed",
      technologies: ["Node.js", "Commander.js", "Chalk"],
      tags: ["tool", "cli", "productivity"],
    },
  },
  {
    id: "game",
    name: "Game",
    description: "Interactive game or simulation",
    icon: <FiCode className="w-6 h-6" />,
    category: "game",
    defaultTechnologies: ["JavaScript", "Canvas API", "Web Audio API"],
    defaultTags: ["game", "interactive", "canvas"],
    template: {
      title: "My Game",
      description:
        "An interactive web-based game built with HTML5 Canvas and JavaScript. Features engaging gameplay, sound effects, and responsive controls.",
      shortDescription: "Interactive web-based game",
      category: "game",
      status: "in-progress",
      technologies: ["JavaScript", "Canvas API", "Web Audio API"],
      tags: ["game", "interactive", "canvas"],
    },
  },
  {
    id: "other",
    name: "Other Project",
    description: "Custom project template",
    icon: <FiFolder className="w-6 h-6" />,
    category: "other",
    defaultTechnologies: [],
    defaultTags: [],
    template: {
      title: "My Project",
      description:
        "A custom project with unique requirements and specifications. This template provides a clean starting point for any type of project.",
      shortDescription: "Custom project template",
      category: "other",
      status: "planning",
      technologies: [],
      tags: [],
    },
  },
];

interface ProjectTemplatesProps {
  onSelectTemplate: (template: ProjectTemplate) => void;
  selectedCategory?: string;
}

export default function ProjectTemplates({
  onSelectTemplate,
  selectedCategory,
}: ProjectTemplatesProps) {
  const filteredTemplates = selectedCategory
    ? PROJECT_TEMPLATES.filter(
        (template) => template.category === selectedCategory
      )
    : PROJECT_TEMPLATES;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose a Template
        </h3>
        <p className="text-sm text-gray-600">
          Start with a pre-configured template or create from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-200 transition-colors">
                {template.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            </div>

            {template.defaultTechnologies.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Technologies:</p>
                <div className="flex flex-wrap gap-1">
                  {template.defaultTechnologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                  {template.defaultTechnologies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      +{template.defaultTechnologies.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="text-xs text-primary-600 font-medium">
              Use this template →
            </div>
          </button>
        ))}
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <button
          onClick={() => onSelectTemplate(PROJECT_TEMPLATES[7])}
          className="text-sm text-gray-600 hover:text-primary-600 font-medium"
        >
          Or start with a blank project
        </button>
      </div>
    </div>
  );
}
