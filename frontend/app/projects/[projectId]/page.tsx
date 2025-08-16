"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { projectsAPI } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import ProjectDetailsModal from "../ProjectDetailsModal";
import {
  FiStar,
  FiCalendar,
  FiTag,
  FiCode,
  FiEye,
  FiCheckCircle,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        try {
          const res = await projectsAPI.getProject(projectId);
          if (res.data.success) {
            setProject(res.data.data);
          } else {
            setError("Project not found");
          }
        } catch (error) {
          console.error("Error fetching project:", error);
          setError("Failed to load project");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-0">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading project...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-0">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">404</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
              <p className="text-gray-600">The project you're looking for doesn't exist or has been removed.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Project Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                  {project.featured && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <FiStar className="h-3 w-3 mr-1" />
                      Featured
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <img
                      src={getAvatarUrl(project.owner)}
                      alt={project.owner?.firstName}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span>by @{project.owner?.username}</span>
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="h-4 w-4 mr-1" />
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex items-center">
                    <FiEye className="h-4 w-4 mr-1" />
                    {project.views || 0} views
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{project.description}</p>

                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' :
                    project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    <FiCheckCircle className="h-4 w-4 mr-1" />
                    {project.status}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <FiCode className="h-4 w-4 mr-1" />
                    {project.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <FiEye className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            </div>

            {/* Technologies */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <FiTag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Details Modal */}
          {showModal && (
            <ProjectDetailsModal
              project={project}
              open={showModal}
              onClose={() => setShowModal(false)}
              onProjectUpdate={(updatedProject) => setProject(updatedProject)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
