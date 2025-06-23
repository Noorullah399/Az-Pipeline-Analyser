/// <reference types="react" />
import React from 'react';
import { MockProject, MockRepository } from '../types';

interface ProjectRepoSelectorProps {
  projects: MockProject[];
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  repositories: MockRepository[];
  selectedRepoId: string;
  onRepoChange: (repoId: string) => void;
  isLoading: boolean;
}

export const ProjectRepoSelector: React.FC<ProjectRepoSelectorProps> = ({
  projects,
  selectedProjectId,
  onProjectChange,
  repositories,
  selectedRepoId,
  onRepoChange,
  isLoading,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="project" className="block text-sm font-medium text-neutral-dark">
          Project
        </label>
        <select
          id="project"
          value={selectedProjectId}
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={isLoading || projects.length === 0}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-medium focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm disabled:bg-gray-100"
        >
          <option value="">{projects.length === 0 && !isLoading ? "No projects found" : "Select a Project"}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="repository" className="block text-sm font-medium text-neutral-dark">
          Repository
        </label>
        <select
          id="repository"
          value={selectedRepoId}
          onChange={(e) => onRepoChange(e.target.value)}
          disabled={isLoading || repositories.length === 0 || !selectedProjectId}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-medium focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm disabled:bg-gray-100"
        >
          <option value="">{repositories.length === 0 && selectedProjectId && !isLoading ? "No repositories in project" : "Select a Repository"}</option>
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};