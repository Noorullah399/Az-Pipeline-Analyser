export interface AzureCredentials {
  pat: string;
  orgUrl: string;
}

export interface MockProject {
  id: string;
  name:string;
}

export interface MockRepository {
  id: string;
  name: string;
  projectId: string;
}

// Represents a pipeline definition
export interface MockPipeline {
  id: string; // Definition ID
  name: string;
  // Details for YAML-based pipelines, obtained from the build definition
  process?: {
    type: number; // 1 for Designer/Classic, 2 for YAML
    yamlFilename?: string; // Path to YAML file in the repo, e.g., "/azure-pipelines.yml"
  };
  repository?: { // The repository where the YAML file for this pipeline definition resides
    id: string; // ID of the repository
    type?: string; // e.g., "azureReposGit"
  };
}

export interface AzureFileItem {
  path: string; // Full path of the item
  name: string; // Name of the item
  isFolder: boolean;
  url?: string; // API URL for the item
  commitId?: string; // Last commit ID affecting this item
  size?: number; // Size in bytes for files
}


export enum ActiveTab {
  CodeReview = "CodeReview",
  SecurityScan = "SecurityScan",
  AdvancedCodeScan = "AdvancedCodeScan",
  PipelineAnalyzer = "PipelineAnalyzer", // Renamed from PipelineViewer
  PipelineWriter = "PipelineWriter",
}