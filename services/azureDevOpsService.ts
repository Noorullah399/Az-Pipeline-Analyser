import { AzureCredentials, MockProject, MockRepository, MockPipeline, AzureFileItem } from '../types';

// Azure DevOps API Version
const API_VERSION_PARAM = "api-version=7.0"; // Use a consistent param name

export class AzureDevOpsService {

  private static async request<T>(url: string, pat: string, method: string = 'GET', headers: HeadersInit = {}): Promise<T> {
    const requestHeaders = new Headers(headers);
    let expectingJson = false; 

    if (!requestHeaders.has('Authorization')) {
      requestHeaders.set('Authorization', `Basic ${btoa(`:${pat}`)}`);
    }

    // Determine if JSON is expected based on Accept header
    // For GET requests, if no specific Accept header is provided, we default to application/json
    // and thus expect a JSON response.
    if (method === 'GET') {
      if (!requestHeaders.has('Accept')) {
        requestHeaders.set('Accept', 'application/json');
        expectingJson = true;
      } else if (requestHeaders.get('Accept')?.includes('application/json')) {
        expectingJson = true;
      }
    }
    // For other methods like POST, PUT, etc., the expectation of JSON might vary
    // but many ADO APIs also use JSON for requests and responses.
    // If a specific 'Accept' header is provided (e.g., 'text/plain'), expectingJson remains false.


    const fullUrl = url.includes('?') ? `${url}&${API_VERSION_PARAM}` : `${url}?${API_VERSION_PARAM}`;

    let response: Response;
    try {
        response = await fetch(fullUrl, {
            method,
            headers: requestHeaders,
        });
    } catch (networkError) {
        console.error(`Azure DevOps API Network Error for ${method} ${fullUrl}:`, networkError);
        throw new Error(`Network error while contacting Azure DevOps: ${(networkError as Error).message}. Check your internet connection and VPN settings.`);
    }


    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not retrieve error details from failing response.");
      console.error(`Azure DevOps API Error: ${response.status} ${response.statusText} for ${method} ${fullUrl}`, errorText);
      if (response.status === 401) { // Unauthorized
        throw new Error(`Azure DevOps API Error: ${response.status} Unauthorized. Please check your Personal Access Token (PAT) and its permissions. Details: ${errorText}`);
      }
      if (response.status === 403) { // Forbidden
         throw new Error(`Azure DevOps API Error: ${response.status} Forbidden. Your PAT may lack required scopes/permissions for this resource. Details: ${errorText}`);
      }
      if (response.status === 404) { // Not Found
        throw new Error(`Azure DevOps API Error: ${response.status} Not Found. The requested resource (e.g., Org URL, project, repo, file) might be incorrect or not exist. URL: ${fullUrl}. Details: ${errorText}`);
      }
      throw new Error(`Azure DevOps API Error: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const contentType = response.headers.get("content-type");

    // If we expected JSON but received HTML, it's very likely an auth redirect or similar issue
    // even if the status code was 200 (e.g. for a login page).
    if (expectingJson && contentType?.includes("text/html")) {
        const errorHint = await response.text().catch(() => "Could not read HTML response body.");
        console.error(`Azure DevOps API Error: Expected JSON but received HTML for ${method} ${fullUrl}. This often indicates an authentication issue (e.g., invalid PAT, incorrect Org URL, or redirection to a login page). Response preview: ${errorHint.substring(0, 500)}`);
        throw new Error("Authentication failed or redirection occurred. Expected JSON from Azure DevOps but received HTML. Please verify your PAT, Organization URL, and ensure the PAT has correct scopes (e.g., Project Read, Code Read).");
    }

    if (contentType?.includes("application/json")) {
        return response.json() as Promise<T>;
    }
    
    // Specific handling for expected text content (e.g. file content)
    if (contentType?.includes("text/plain") || contentType?.includes("application/octet-stream") || url.includes("$format=text") || url.includes("format=text") || requestHeaders.get('Accept')?.includes('text/plain')) {
       return response.text() as unknown as Promise<T>;
    }
    
    // Fallback for unexpected content types if response.ok was true, but JSON wasn't expected or received.
    // This path should be rare for ADO APIs.
    console.warn(`Azure DevOps API: Received OK response for ${fullUrl} but with unexpected Content-Type: ${contentType}. Attempting to return as text. This may lead to errors if the caller expects a specific object structure.`);
    return response.text() as unknown as Promise<T>;
  }

  public static async getProjects(credentials: AzureCredentials): Promise<MockProject[]> {
    if (!credentials.pat || !credentials.orgUrl) {
      throw new Error("Azure PAT and Org URL are required.");
    }
    const url = `${credentials.orgUrl}/_apis/projects`;
    console.log('Azure DevOps: Fetching projects from:', url);
    
    // The request method will now throw if it gets HTML when JSON is expected
    const responseData = await AzureDevOpsService.request<{ value: { id: string, name: string }[] }>(url, credentials.pat);
    
    if (!responseData || !Array.isArray(responseData.value)) {
        console.error('Azure DevOps: getProjects received unexpected data structure (after request processing):', responseData);
        throw new Error('Failed to fetch projects: Unexpected data structure received from Azure DevOps, or non-JSON response was not caught by the request handler.');
    }
    return responseData.value.map(p => ({ id: p.id, name: p.name }));
  }

  public static async getRepositories(credentials: AzureCredentials, projectId: string): Promise<MockRepository[]> {
    if (!credentials.pat || !credentials.orgUrl || !projectId) {
      throw new Error("Azure PAT, Org URL, and Project ID are required.");
    }
    const url = `${credentials.orgUrl}/${projectId}/_apis/git/repositories`;
    console.log('Azure DevOps: Fetching repositories for project:', projectId);
    
    const responseData = await AzureDevOpsService.request<{ value: { id: string, name: string }[] }>(url, credentials.pat);
    if (!responseData || !Array.isArray(responseData.value)) {
        console.error('Azure DevOps: getRepositories received unexpected data structure:', responseData);
        throw new Error('Failed to fetch repositories: Unexpected data structure received from Azure DevOps.');
    }
    return responseData.value.map(r => ({ id: r.id, name: r.name, projectId }));
  }

  public static async getPipelines(credentials: AzureCredentials, projectId: string): Promise<MockPipeline[]> {
    if (!credentials.pat || !credentials.orgUrl || !projectId) {
      throw new Error("Azure PAT, Org URL, and Project ID are required.");
    }
    const url = `${credentials.orgUrl}/${projectId}/_apis/build/definitions`;
    console.log('Azure DevOps: Fetching pipeline definitions for project:', projectId);
    
    const responseData = await AzureDevOpsService.request<{ value: any[] }>(url, credentials.pat);
    if (!responseData || !Array.isArray(responseData.value)) {
        console.error('Azure DevOps: getPipelines received unexpected data structure:', responseData);
        throw new Error('Failed to fetch pipelines: Unexpected data structure received from Azure DevOps.');
    }
    return responseData.value.map(def => ({
      id: def.id.toString(),
      name: def.name,
      process: def.process ? {
        type: def.process.type,
        yamlFilename: def.process.yamlFilename,
      } : undefined,
      repository: def.repository ? {
        id: def.repository.id,
        type: def.repository.type,
      } : undefined,
    }));
  }
  
  public static async getPipelineYamlContent(credentials: AzureCredentials, projectId: string, pipeline: MockPipeline): Promise<string> {
    if (!credentials.pat || !credentials.orgUrl || !projectId || !pipeline || !pipeline.id) {
        throw new Error("Azure PAT, Org URL, Project ID, and Pipeline details are required.");
    }
    console.log('Azure DevOps: Fetching YAML content for pipeline:', pipeline.name);

    if (pipeline.process?.type === 2 && pipeline.process.yamlFilename && pipeline.repository?.id) {
        const repoId = pipeline.repository.id;
        const filePath = pipeline.process.yamlFilename.startsWith('/') ? pipeline.process.yamlFilename.substring(1) : pipeline.process.yamlFilename;
        // Requesting specific text content, so set Accept header accordingly
        const fileUrl = `${credentials.orgUrl}/${projectId}/_apis/git/repositories/${repoId}/items?path=${encodeURIComponent(filePath)}&$format=text`;
        console.log('Fetching YAML file from:', fileUrl);
        return AzureDevOpsService.request<string>(fileUrl, credentials.pat, 'GET', { 'Accept': 'text/plain' });
    } else if (pipeline.process?.type === 1) {
        return Promise.resolve(`Pipeline "${pipeline.name}" is a Classic (UI-based) pipeline. YAML content is not directly available in this format.`);
    } else {
        // Fallback: Fetch full definition to see if it's YAML
        const definitionUrl = `${credentials.orgUrl}/${projectId}/_apis/build/definitions/${pipeline.id}`;
        console.log('Fetching full pipeline definition from:', definitionUrl);
        const fullDefinition = await AzureDevOpsService.request<any>(definitionUrl, credentials.pat); // Expects JSON

        if (fullDefinition.process?.type === 2 && fullDefinition.process.yamlFilename && fullDefinition.repository?.id) {
            const repoId = fullDefinition.repository.id;
            const filePath = fullDefinition.process.yamlFilename.startsWith('/') ? fullDefinition.process.yamlFilename.substring(1) : fullDefinition.process.yamlFilename;
            const fileUrl = `${credentials.orgUrl}/${projectId}/_apis/git/repositories/${repoId}/items?path=${encodeURIComponent(filePath)}&$format=text`;
            console.log('Fetching YAML file (after full def fetch) from:', fileUrl);
            return AzureDevOpsService.request<string>(fileUrl, credentials.pat, 'GET', { 'Accept': 'text/plain' });
        } else if (fullDefinition.process?.type === 1) {
             return Promise.resolve(`Pipeline "${pipeline.name}" is a Classic (UI-based) pipeline. YAML content is not directly available in this format.`);
        }
        return Promise.reject(new Error(`Pipeline "${pipeline.name}" is not a recognized YAML pipeline or required information (YAML path, repository) is missing from its definition.`));
    }
  }

  public static async getFileContent(credentials: AzureCredentials, projectId: string, repoId: string, filePath: string): Promise<string> {
    if (!credentials.pat || !credentials.orgUrl || !projectId || !repoId || !filePath) {
        throw new Error("Azure PAT, Org URL, Project ID, Repo ID, and File Path are required.");
    }
    const cleanFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const url = `${credentials.orgUrl}/${projectId}/_apis/git/repositories/${repoId}/items?path=${encodeURIComponent(cleanFilePath)}&$format=text`;
    console.log('Azure DevOps: Fetching file content:', cleanFilePath, 'from repo:', repoId);
    // Explicitly ask for text plain, so expectingJson will be false
    return AzureDevOpsService.request<string>(url, credentials.pat, 'GET', { 'Accept': 'text/plain' });
  }

  public static async listFiles(credentials: AzureCredentials, projectId: string, repoId: string, itemPath: string = '/'): Promise<AzureFileItem[]> {
    if (!credentials.pat || !credentials.orgUrl || !projectId || !repoId) {
      throw new Error("Azure PAT, Org URL, Project ID, and Repo ID are required for listing files.");
    }
    const scopePath = itemPath === '/' || itemPath === '' ? '/' : (itemPath.startsWith('/') ? itemPath : `/${itemPath}`);
    
    const url = `${credentials.orgUrl}/${projectId}/_apis/git/repositories/${repoId}/items?scopePath=${encodeURIComponent(scopePath)}&recursionLevel=None`;
    console.log('Azure DevOps: Listing files for path:', scopePath, 'in repo:', repoId);

    // Expects JSON
    const responseData = await AzureDevOpsService.request<{ value: { path: string; gitObjectType: 'blob' | 'tree'; url: string; objectId: string; commitId: string; size?: number }[] }>(url, credentials.pat);
    
    if (!responseData || !Array.isArray(responseData.value)) {
        console.error('Azure DevOps: listFiles received unexpected data structure:', responseData);
        throw new Error('Failed to list files: Unexpected data structure received from Azure DevOps.');
    }
    
    return responseData.value.map(item => {
      const fullPath = item.path;
      // For root items, item.path might be just "/filename.txt", so name extraction needs care
      // If fullPath is "/foo/bar.txt", name is "bar.txt"
      // If fullPath is "/file.txt", name is "file.txt"
      // If fullPath is "/", it might not appear or be handled by scopePath; ADO usually returns items within the scope.
      let name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
      if (itemPath === '/' && fullPath.startsWith('/') && !fullPath.substring(1).includes('/')) {
         name = fullPath.substring(1); // e.g. "/file.txt" -> "file.txt"
      }


      return {
        path: fullPath, 
        name: name,
        isFolder: item.gitObjectType === 'tree',
        url: item.url,
        commitId: item.commitId,
        size: item.gitObjectType === 'blob' ? item.size : undefined,
      };
    }).sort((a, b) => { 
        if (a.isFolder !== b.isFolder) {
            return a.isFolder ? -1 : 1; // Folders first
        }
        return a.name.localeCompare(b.name); // Then sort by name
    });
  }
}