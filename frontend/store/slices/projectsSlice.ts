import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Project, ApiResponse, PaginationParams } from "@/types";
import { projectsAPI } from "@/lib/api";

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (params?: PaginationParams) => {
    const response = await projectsAPI.getProjects(params);
    return response.data;
  }
);

export const fetchProject = createAsyncThunk(
  "projects/fetchProject",
  async (id: string) => {
    const response = await projectsAPI.getProject(id);
    return response.data;
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData: any) => {
    const response = await projectsAPI.createProject(projectData);
    return response.data;
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, data }: { id: string; data: any }) => {
    const response = await projectsAPI.updateProject(id, data);
    return response.data;
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id: string) => {
    await projectsAPI.deleteProject(id);
    return id;
  }
);

export const likeProject = createAsyncThunk(
  "projects/likeProject",
  async (id: string) => {
    const response = await projectsAPI.likeProject(id);
    return response.data;
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch projects";
      });

    // Fetch Project
    builder
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload.data;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch project";
      });

    // Create Project
    builder
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload.data);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to create project";
      });

    // Update Project
    builder
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedProject = action.payload.data;
        state.projects = state.projects.map((project) =>
          project._id === updatedProject._id ? updatedProject : project
        );
        if (state.currentProject?._id === updatedProject._id) {
          state.currentProject = updatedProject;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update project";
      });

    // Delete Project
    builder
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = state.projects.filter(
          (project) => project._id !== action.payload
        );
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to delete project";
      });

    // Like Project
    builder.addCase(likeProject.fulfilled, (state, action) => {
      const { isLiked, likesCount } = action.payload.data;
      const projectId = action.meta.arg;

      // Update in projects list
      state.projects = state.projects.map((project) =>
        project._id === projectId
          ? { ...project, isLiked, likesCount }
          : project
      );

      // Update current project if it's the same
      if (state.currentProject?._id === projectId) {
        state.currentProject = { ...state.currentProject, isLiked, likesCount };
      }
    });
  },
});

export const { clearError, clearCurrentProject, setProjects } =
  projectsSlice.actions;
export default projectsSlice.reducer;
