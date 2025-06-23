/// <reference types="react" />
import React, { useState, useCallback, useEffect } from 'react';
import { AzureAuthForm } from './components/AzureAuthForm';
import { ProjectRepoSelector } from './components/ProjectRepoSelector';
import { CodeInput } from './components/CodeInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Tabs, Tab } from './components/Tabs';
import { AzureIcon } from './components/icons/AzureIcon';
import { GeminiIcon } from './components/icons/GeminiIcon';
import { SecurityIcon } from './components/icons/SecurityIcon';
import { PipelineIcon } from './components/icons/PipelineIcon';
import { CodeIcon } from './components/icons/CodeIcon';
import { AzureDevOpsService } from './services/azureDevOpsService';
import { GeminiService } from './services/geminiService';
import { ActiveTab, AzureCredentials, MockProject, MockRepository, MockPipeline } from './types';
import { INITIAL_AZURE_CREDENTIALS } from './constants';

// Helper function to get parent path (kept in case needed elsewhere)
const getParentPath = (path: string): string => {
  if (path === '/' || !path.includes('/')) return '/';
  return path.substring(0, path.lastIndexOf('/')) || '/';
};

// Helper function to generate breadcrumbs (kept in case needed elsewhere)
const generateBreadcrumbs = (path: string, onNavigate: (path: string) => void) => {
  if (path === '/') return [<span key="root" className="text-neutral-medium">Root</span>];
  const segments = path.split('/').filter(Boolean);
  let currentPath = '';
  return [
    <button key="root-btn" onClick={() => onNavigate('/')} className="hover:underline text-brand-primary">Root</button>,
    ...segments.map((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const pathOnClick = currentPath; // Capture currentPath for onClick
      return (
        <span key={currentPath}>
          <span className="mx-1 text-neutral-medium">/</span>
          {isLast ? (
            <span className="text-neutral-medium">{segment}</span>
          ) : (
            <button onClick={() => onNavigate(pathOnClick)} className="hover:underline text-brand-primary">
              {segment}
            </button>
          )}
        </span>
      );
    }),
  ];
};

// Instantiate Gemini Service. Constructor now handles its own errors internally.
const geminiServiceInstance = new GeminiService();
let DYNAMIC_INITIAL_GEMINI_ERROR: string | null = null; // Use a different name to avoid confusion with component state

const initError = geminiServiceInstance.getInitializationError();
if (initError) {
  console.error("Failed to initialize GeminiService:", initError);
  DYNAMIC_INITIAL_GEMINI_ERROR = `Gemini AI Service Initialization Error: ${initError.message}. Ensure API_KEY is correctly configured. Some features will be unavailable.`;
}

const App = () => {
  const [azureCreds, setAzureCreds] = useState<AzureCredentials>(INITIAL_AZURE_CREDENTIALS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [projects, setProjects] = useState<MockProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [repositories, setRepositories] = useState<MockRepository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [pipelines, setPipelines] = useState<MockPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.CodeReview);
  const [code, setCode] = useState<string>(''); 
  const [projectDescription, setProjectDescription] = useState<string>(''); 
  const [results, setResults] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // This state will hold the error message for display
  const [geminiServiceError, setGeminiServiceError] = useState<string | null>(DYNAMIC_INITIAL_GEMINI_ERROR);

  // State for Advanced Code Scan (File Path Input)
  const [filePathForAdvancedScan, setFilePathForAdvancedScan] = useState<string>('');


  const azureService = AzureDevOpsService;

  useEffect(() => {
    // This effect ensures the displayed error matches the initial error from service instantiation.
    // It runs once on mount. If DYNAMIC_INITIAL_GEMINI_ERROR changes (it shouldn't after init), this won't pick it up.
    // This is primarily for setting the error from the module scope into React state.
    if (DYNAMIC_INITIAL_GEMINI_ERROR && geminiServiceError !== DYNAMIC_INITIAL_GEMINI_ERROR) {
        setGeminiServiceError(DYNAMIC_INITIAL_GEMINI_ERROR);
    } else if (!DYNAMIC_INITIAL_GEMINI_ERROR && geminiServiceError) {
        // If there was no initial error, but state has one (e.g. from old session), clear it.
        setGeminiServiceError(null);
    }
  }, []); // Run once on mount. geminiServiceError is not needed in deps for this logic.

  const handleAuthSubmit = useCallback(async (creds: AzureCredentials) => {
    setIsLoading(true); setError(null);
    try {
      if (creds.pat && creds.orgUrl) {
        setAzureCreds(creds);
        const fetchedProjects = await azureService.getProjects(creds);
        setProjects(fetchedProjects);
        setIsAuthenticated(true);
        if (fetchedProjects.length > 0) setSelectedProjectId(fetchedProjects[0].id);
        else { setSelectedProjectId(''); setRepositories([]); setPipelines([]); }
        setFilePathForAdvancedScan(''); // Reset file path on new auth
      } else throw new Error("PAT and Organization URL are required.");
    } catch (err) {
      setError((err as Error).message); setIsAuthenticated(false);
      setProjects([]); setRepositories([]); setPipelines([]);
      setSelectedProjectId(''); setSelectedRepoId(''); setSelectedPipelineId('');
      setFilePathForAdvancedScan('');
    } finally { setIsLoading(false); }
  }, [azureService]);

  useEffect(() => {
    const fetchReposAndPipelines = async () => {
      if (isAuthenticated && selectedProjectId && azureCreds.pat && azureCreds.orgUrl) {
        setIsLoading(true); setError(null);
        try {
          const fetchedRepos = await azureService.getRepositories(azureCreds, selectedProjectId);
          setRepositories(fetchedRepos);
          if (fetchedRepos.length > 0) setSelectedRepoId(fetchedRepos[0].id);
          else setSelectedRepoId('');

          const fetchedPipelines = await azureService.getPipelines(azureCreds, selectedProjectId);
          setPipelines(fetchedPipelines);
          if (fetchedPipelines.length > 0) setSelectedPipelineId(fetchedPipelines[0].id);
          else setSelectedPipelineId('');
        } catch (err) {
          setError((err as Error).message);
          setRepositories([]); setPipelines([]); setSelectedRepoId(''); setSelectedPipelineId('');
        } finally { setIsLoading(false); }
      } else if (!selectedProjectId) {
        setRepositories([]); setPipelines([]); setSelectedRepoId(''); setSelectedPipelineId('');
      }
    };
    fetchReposAndPipelines();
  }, [isAuthenticated, selectedProjectId, azureCreds, azureService]);
  
  const handleFetchCodeForReview = useCallback(async () => {
    if (!isAuthenticated || !selectedRepoId || !selectedProjectId) {
      setError("Please connect to Azure DevOps and select a project and repository."); return;
    }
    const filePathToFetch = "README.md"; 
    setIsLoading(true); setError(null); setResults('');
    try {
      const fileContent = await azureService.getFileContent(azureCreds, selectedProjectId, selectedRepoId, filePathToFetch);
      setCode(fileContent); 
      setResults(`Successfully fetched ${filePathToFetch}. Content is now in the code input area.`);
    } catch (err) {
      setError(`Failed to fetch ${filePathToFetch}: ${(err as Error).message}`); setCode(''); setResults('');
    } finally { setIsLoading(false); }
  }, [isAuthenticated, selectedProjectId, selectedRepoId, azureCreds, azureService]);


  const handleSubmitReview = useCallback(async () => {
    if (geminiServiceError) { setError(geminiServiceError); return; }
    if (!code) { setError("Please enter/fetch code to review."); return; }
    setIsLoading(true); setError(null); setResults('');
    try {
      const prompt = `Perform a code review on the following code. Focus on quality, best practices, bugs, and readability. Provide constructive feedback:\n\n\`\`\`\n${code}\n\`\`\``;
      const review = await geminiServiceInstance.generateText(prompt);
      setResults(review);
    } catch (err) { setError((err as Error).message); setResults('');} 
    finally { setIsLoading(false); }
  }, [code, geminiServiceError]);

  const handleSubmitSecurityScan = useCallback(async () => {
    if (geminiServiceError) { setError(geminiServiceError); return; }
    if (!code) { setError("Please enter/fetch code to scan."); return; }
    setIsLoading(true); setError(null); setResults('');
    try {
      const prompt = `Analyze the following code for security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.). List findings with severity and remediation advice:\n\n\`\`\`\n${code}\n\`\`\``;
      const scanResult = await geminiServiceInstance.generateText(prompt);
      setResults(scanResult);
    } catch (err) { setError((err as Error).message); setResults(''); }
    finally { setIsLoading(false); }
  }, [code, geminiServiceError]);

  const handleViewPipeline = useCallback(async () => {
    if (!isAuthenticated || !selectedPipelineId || !selectedProjectId) {
      setError("Please select an Azure DevOps project and a pipeline to view."); return;
    }
    const selectedPipelineObject = pipelines.find(p => p.id === selectedPipelineId);
    if (!selectedPipelineObject) { setError("Selected pipeline details not found."); return; }

    setIsLoading(true); setError(null); setResults(''); setCode('');
    try {
      const pipelineContent = await azureService.getPipelineYamlContent(azureCreds, selectedProjectId, selectedPipelineObject);
      
      if (typeof pipelineContent === 'string' && 
          (pipelineContent.includes("Classic (UI-based) pipeline") || 
           pipelineContent.includes("not a recognized YAML pipeline") ||
           pipelineContent.startsWith("Pipeline "))) { 
        setResults(pipelineContent); 
        setCode(''); 
      } else if (typeof pipelineContent === 'string') {
        setResults(pipelineContent); 
        setCode(pipelineContent);   
      } else {
        throw new Error("Unexpected content type received for pipeline.");
      }
    } catch (err) { 
      const errorMessage = `Failed to load pipeline content for "${selectedPipelineObject.name}": ${(err as Error).message}`;
      setError(errorMessage); 
      setResults(errorMessage); 
      setCode('');
    } finally { setIsLoading(false); }
  }, [isAuthenticated, selectedPipelineId, selectedProjectId, pipelines, azureCreds, azureService]);

  const handleAnalyzePipeline = useCallback(async () => {
    if (geminiServiceError) { setError(geminiServiceError); return; }
    
    const pipelineYamlToAnalyze = code; // Use 'code' state which holds the actual YAML

    if (!pipelineYamlToAnalyze || typeof pipelineYamlToAnalyze !== 'string' || pipelineYamlToAnalyze.trim() === '') {
        setError("Valid pipeline YAML must be loaded using 'View Pipeline YAML' first. The selected item might not be a YAML pipeline, or an error might have occurred while fetching it.");
        setIsLoading(false); 
        return;
    }

    setIsLoading(true); setError(null); 
    try {
      const prompt = `Analyze the following Azure DevOps pipeline YAML. Identify issues (security, best practices, errors, inefficiencies). Provide a summary of findings and then provide a 'fixed' or improved version of the YAML. Ensure the fixed YAML is complete and valid. Structure your response with "Analysis:" followed by your findings, and then "Suggested YAML:" followed by the complete YAML code block.

Current Pipeline YAML:
\`\`\`yaml
${pipelineYamlToAnalyze}
\`\`\``;
      const analysisResult = await geminiServiceInstance.generateText(prompt);
      setResults(analysisResult); 
    } catch (err) { 
        setError(`Pipeline analysis failed: ${(err as Error).message}`);
    } finally { setIsLoading(false); }
  }, [geminiServiceError, code, geminiServiceInstance]);


  const handleSubmitPipelineWriter = useCallback(async () => {
    if (geminiServiceError) { setError(geminiServiceError); return; }
    if (!projectDescription && !code) { setError("Provide project description or code for pipeline generation."); return; }
    setIsLoading(true); setError(null); setResults('');
    try {
      let prompt = `Suggest an Azure DevOps YAML pipeline. `;
      if (projectDescription) prompt += `Project description: "${projectDescription}". `;
      if (code) prompt += `Sample code:\n\`\`\`\n${code}\n\`\`\`\n`;
      prompt += `Include build, test, deploy stages. Be specific. Output as YAML code block.`;
      const pipelineSuggestion = await geminiServiceInstance.generateText(prompt);
      setResults(pipelineSuggestion);
    } catch (err) { setError((err as Error).message); setResults('');}
    finally { setIsLoading(false); }
  }, [projectDescription, code, geminiServiceError]);
  
  const handleAdvancedCodeScan = useCallback(async () => {
    if (geminiServiceError) { setError(geminiServiceError); return; }
    if (!filePathForAdvancedScan.trim()) { setError("Please enter a file path to scan."); return; }
    if (!isAuthenticated || !selectedProjectId || !selectedRepoId) { setError("Azure DevOps connection lost or project/repo not selected."); return;}

    setIsLoading(true); setError(null); setResults('');
    try {
      const fileContent = await azureService.getFileContent(azureCreds, selectedProjectId, selectedRepoId, filePathForAdvancedScan);
      const prompt = `Perform an advanced and comprehensive code scan on the following file content (path: ${filePathForAdvancedScan}). 
Analyze for:
1. Code Quality & Best Practices (readability, maintainability, SOLID principles if applicable, anti-patterns).
2. Potential Bugs (logic errors, null pointer exceptions, race conditions, resource leaks).
3. Security Vulnerabilities (OWASP Top 10 like Injection, XSS, CSRF, insecure deserialization, hardcoded secrets, weak cryptography, improper access control).
4. Performance Bottlenecks (inefficient algorithms, excessive I/O, memory issues).
5. Adherence to common language-specific conventions.

Provide a structured report with:
- A brief summary of the file's purpose (if discernible).
- A list of findings, categorized by type (Quality, Bug, Security, Performance).
- For each finding:
    - Description of the issue.
    - Severity (Critical, High, Medium, Low, Informational).
    - Specific code snippet if applicable.
    - Recommendation for fixing or improving.

File Content:
\`\`\`
${fileContent}
\`\`\``;
      const scanReport = await geminiServiceInstance.generateText(prompt);
      setResults(scanReport);
    } catch (err) { 
        setError(`Failed to scan file ${filePathForAdvancedScan}: ${(err as Error).message}`); 
        setResults('');
    } finally { setIsLoading(false); }
  }, [geminiServiceError, filePathForAdvancedScan, isAuthenticated, selectedProjectId, selectedRepoId, azureCreds, azureService]);


  const commonButtonStyles = "px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition-colors duration-150";

  const renderContent = () => {
    if (!isAuthenticated && [ActiveTab.PipelineAnalyzer, ActiveTab.AdvancedCodeScan].includes(activeTab)) {
      return <p className="text-neutral-medium text-center p-4">Please connect to Azure DevOps to use this feature.</p>;
    }
    if (isAuthenticated && !selectedProjectId && [ActiveTab.PipelineAnalyzer, ActiveTab.AdvancedCodeScan].includes(activeTab)) {
        return <p className="text-neutral-medium text-center p-4">Please select a project.</p>;
    }
     if (isAuthenticated && !selectedRepoId && activeTab === ActiveTab.AdvancedCodeScan) {
        return <p className="text-neutral-medium text-center p-4">Please select a repository to specify a file path.</p>;
    }

    switch (activeTab) {
      case ActiveTab.CodeReview:
      case ActiveTab.SecurityScan:
        return (
          <>
            <CodeInput value={code} onChange={setCode} placeholder={activeTab === ActiveTab.CodeReview ? "Paste code for review or fetch from repo..." : "Paste code for security scan or fetch from repo..."} />
             {isAuthenticated && selectedRepoId && (
                 <button
                    onClick={handleFetchCodeForReview}
                    disabled={isLoading || !selectedRepoId}
                    className="mt-2 text-sm text-brand-primary hover:text-brand-secondary disabled:opacity-50"
                    aria-label="Fetch README.md from selected repository"
                 >
                    Fetch README.md from Repo
                 </button>
            )}
            <button
              onClick={activeTab === ActiveTab.CodeReview ? handleSubmitReview : handleSubmitSecurityScan}
              disabled={isLoading || !code || !!geminiServiceError}
              className={`mt-4 w-full sm:w-auto flex items-center justify-center ${commonButtonStyles}`}
              aria-label={activeTab === ActiveTab.CodeReview ? 'Submit code for review' : 'Submit code for security scan'}
            >
              {activeTab === ActiveTab.CodeReview ? <CodeIcon className="w-5 h-5 mr-2" /> : <SecurityIcon className="w-5 h-5 mr-2" />}
              {activeTab === ActiveTab.CodeReview ? 'Review Code' : 'Scan Code'}
            </button>
          </>
        );
      case ActiveTab.AdvancedCodeScan:
        if (!isAuthenticated || !selectedProjectId || !selectedRepoId) return <p className="text-neutral-medium text-center p-4">Select project and repository to specify a file path for scanning.</p>;
        return (
            <div className="space-y-4">
                <div>
                    <label htmlFor="filePathInput" className="block text-sm font-medium text-neutral-dark mb-1">
                        File Path in Repository
                    </label>
                    <input
                        type="text"
                        id="filePathInput"
                        value={filePathForAdvancedScan}
                        onChange={(e) => setFilePathForAdvancedScan(e.target.value)}
                        placeholder="e.g., /src/app.js or azure-pipelines.yml"
                        className="mt-1 block w-full px-3 py-2 border border-neutral-medium rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                        aria-label="File path for advanced scan"
                    />
                     <p className="mt-1 text-xs text-neutral-medium">Enter the full path to the file within the selected repository (e.g., /src/main.py).</p>
                </div>
                <button
                    onClick={handleAdvancedCodeScan}
                    disabled={isLoading || !filePathForAdvancedScan.trim() || !!geminiServiceError || !selectedRepoId || !selectedProjectId}
                    className={`mt-4 w-full sm:w-auto flex items-center justify-center ${commonButtonStyles}`}
                    aria-label="Deep scan specified file path"
                >
                    <SecurityIcon className="w-5 h-5 mr-2" /> Deep Scan File Path
                </button>
            </div>
        );

      case ActiveTab.PipelineAnalyzer:
         if (!isAuthenticated || !selectedProjectId) return <p className="text-neutral-medium text-center p-4">Connect to Azure DevOps and select a project to analyze pipelines.</p>;
        return (
          <div className="space-y-4">
            <select
              id="pipeline-select"
              aria-label="Select Pipeline"
              value={selectedPipelineId}
              onChange={(e) => {setSelectedPipelineId(e.target.value); setResults(''); setCode('');}}
              disabled={isLoading || pipelines.length === 0 || !selectedProjectId}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-neutral-medium focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md shadow-sm disabled:bg-gray-100"
            >
              <option value="">{isLoading && !pipelines.length ? "Loading..." : (pipelines.length === 0 && selectedProjectId ? "No pipelines" : "Select Pipeline")}</option>
              {pipelines.map((pipeline) => ( <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option> ))}
            </select>
            <div className="flex flex-wrap gap-2">
                <button
                onClick={handleViewPipeline}
                disabled={isLoading || !selectedPipelineId}
                className={`sm:w-auto flex items-center justify-center ${commonButtonStyles}`}
                aria-label="View selected pipeline YAML"
                >
                <PipelineIcon className="w-5 h-5 mr-2" /> View Pipeline YAML
                </button>
                <button
                onClick={handleAnalyzePipeline}
                disabled={isLoading || !selectedPipelineId || !!geminiServiceError || !code}
                className={`sm:w-auto flex items-center justify-center ${commonButtonStyles}`}
                title={!code ? "View pipeline YAML first to load valid YAML content" : "Analyze pipeline and suggest improvements"}
                aria-label="Analyze pipeline and suggest improvements"
                >
                <GeminiIcon className="w-5 h-5 mr-2" /> Analyze & Suggest Fixes
                </button>
            </div>
          </div>
        );
      case ActiveTab.PipelineWriter:
        return (
          <div className="space-y-4">
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Describe project requirements, tech used, deployment targets for pipeline generation."
              rows={5}
              className="w-full p-3 border border-neutral-medium rounded-lg shadow-sm text-sm bg-gray-50 focus:ring-brand-primary focus:border-brand-primary focus:bg-white transition-colors"
              aria-label="Project description for pipeline generation"
            />
            <CodeInput value={code} onChange={setCode} placeholder="Optionally, paste relevant code snippets..." rows={8}/>
             {isAuthenticated && selectedRepoId && (
                 <button
                    onClick={handleFetchCodeForReview} 
                    disabled={isLoading || !selectedRepoId}
                    className="mt-2 text-sm text-brand-primary hover:text-brand-secondary disabled:opacity-50"
                    aria-label="Fetch README.md from selected repository to use as context"
                 >
                    Fetch README.md for Context
                 </button>
            )}
            <button
              onClick={handleSubmitPipelineWriter}
              disabled={isLoading || (!projectDescription && !code) || !!geminiServiceError}
              className={`mt-4 w-full sm:w-auto flex items-center justify-center ${commonButtonStyles}`}
              aria-label="Generate pipeline suggestion with Gemini"
            >
              <GeminiIcon className="w-5 h-5 mr-2" /> Generate Pipeline Suggestion
            </button>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-light text-neutral-dark p-4 sm:p-6 md:p-8">
      {isLoading && <LoadingSpinner />}
      {results && <ResultsDisplay title="Assistant's Response" content={results} onClose={() => setResults('')} />}

      <header className="mb-8 text-center">
        <div className="flex items-center justify-center mb-2" role="banner">
          <GeminiIcon className="w-10 h-10 text-brand-primary mr-3" aria-hidden="true" />
          <AzureIcon className="w-10 h-10 text-brand-secondary mr-3" aria-hidden="true" />
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-dark">Azure DevOps Code & Pipeline Assistant</h1>
        </div>
        <p className="text-neutral-medium text-sm sm:text-base">
          AI-powered assistance for Azure DevOps: code review, security scanning, advanced analysis, and pipeline tasks.
        </p>
      </header>
      
      {geminiServiceError && (
         <div className="fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg z-50" role="alert">
            <div className="flex">
                <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM11.414 10l2.829-2.828-1.414-1.414L10 8.586 7.172 5.757 5.757 7.172 8.586 10l-2.829 2.828 1.414 1.414L10 11.414l2.828 2.829 1.414-1.414L11.414 10z"/></svg></div>
                <div>
                    <p className="font-bold">Gemini Service Error</p>
                    <p className="text-sm">{geminiServiceError}</p>
                </div>
            </div>
        </div>
      )}


      {!isAuthenticated ? (
        <AzureAuthForm onSubmit={handleAuthSubmit} isLoading={isLoading} initialCreds={azureCreds} />
      ) : (
        <main className="space-y-6 max-w-5xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl" aria-labelledby="main-app-title">
          <div className="flex justify-between items-center">
            <h2 id="main-app-title" className="text-xl font-semibold text-brand-primary">Azure DevOps Integration</h2>
            <button 
              onClick={() => { 
                setIsAuthenticated(false); setAzureCreds(INITIAL_AZURE_CREDENTIALS);
                setProjects([]); setSelectedProjectId(''); setRepositories([]); setSelectedRepoId('');
                setPipelines([]); setSelectedPipelineId(''); setError(null);
                setCode(''); setResults(''); setProjectDescription('');
                setFilePathForAdvancedScan(''); // Reset new state
              }}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
              aria-label="Disconnect from Azure DevOps"
            >
              Disconnect
            </button>
          </div>
          <ProjectRepoSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectChange={(id) => {
                setSelectedProjectId(id); 
                setSelectedRepoId(''); setSelectedPipelineId(''); 
                setFilePathForAdvancedScan(''); // Reset on project change
                setCode(''); setResults(''); // Clear code/results when project changes
            }}
            repositories={repositories}
            selectedRepoId={selectedRepoId}
            onRepoChange={(id) => {
                setSelectedRepoId(id); 
                setFilePathForAdvancedScan(''); // Reset on repo change
                setCode(''); setResults(''); // Clear code/results when repo changes
            }}
            isLoading={isLoading}
          />
          
          <Tabs activeTab={activeTab} onTabChange={(newTab) => { 
              setActiveTab(newTab); 
              setCode(''); setProjectDescription(''); setResults(''); 
              setFilePathForAdvancedScan(''); // Reset on tab change
            }}>
            <Tab name={ActiveTab.CodeReview} icon={<CodeIcon className="w-5 h-5 mr-2" />}>Simple Review</Tab>
            <Tab name={ActiveTab.SecurityScan} icon={<SecurityIcon className="w-5 h-5 mr-2" />}>Simple Scan</Tab>
            <Tab name={ActiveTab.AdvancedCodeScan} icon={<CodeIcon className="w-5 h-5 mr-2" />}>Advanced Scan</Tab>
            <Tab name={ActiveTab.PipelineAnalyzer} icon={<PipelineIcon className="w-5 h-5 mr-2" />}>Pipeline Analyzer</Tab>
            <Tab name={ActiveTab.PipelineWriter} icon={<GeminiIcon className="w-5 h-5 mr-2" />}>Pipeline Writer</Tab>
          </Tabs>

          <div className="mt-6 p-4 border border-neutral-light rounded-lg bg-gray-50/50 min-h-[200px]">
            {renderContent()}
          </div>
        </main>
      )}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50" role="alertdialog" aria-live="assertive" aria-atomic="true">
          <div className="flex justify-between items-center"> <strong className="font-bold">Error:</strong> <button onClick={() => setError(null)} className="ml-4 text-red-700 hover:text-red-900" aria-label="Close error message"> <span className="text-2xl leading-none">&times;</span> </button> </div>
          <span className="block sm:inline mt-1">{error}</span>
        </div>
      )}
    </div>
  );
};

export default App;