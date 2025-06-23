# Azure DevOps Code & Pipeline Assistant

A modern web application that helps developers analyze code, review pipelines, and perform security scans using Azure DevOps and AI capabilities.

## Features

- Code Review and Analysis
- Security Scanning
- Pipeline YAML Analysis
- Pipeline Suggestions
- Azure DevOps Integration
- AI-Powered Insights

## Prerequisites

- Node.js v20 or later
- Azure DevOps account and Personal Access Token (PAT)
- Docker (optional, for containerized deployment)

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd azure-devops-code-pipeline-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with your configuration:
```env
AZURE_PAT=your_personal_access_token
AZURE_ORG=your_organization_url
API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173

## Docker Deployment

### Using Pre-built Image

1. Pull the image from Docker Hub:
```bash
docker pull noorullah007/azure_devops_analyser:1.0
```

2. Run the container:
```bash
docker run -p 5173:5173 noorullah007/azure_devops_analyser:1.0
```

### Building Locally

1. Build the image:
```bash
docker build -t azure-pipeline-assistant .
```

2. Run the container:
```bash
docker run -p 5173:5173 azure-pipeline-assistant
```

## Usage Guide

1. **Authentication**:
   - Enter your Azure DevOps Personal Access Token (PAT)
   - Provide your organization URL
   - Click "Authenticate"

2. **Project Selection**:
   - Choose your project from the dropdown
   - Select the repository you want to analyze

3. **Code Review**:
   - Paste your code snippet or file content
   - Click "Submit for Review"
   - Review AI-generated suggestions and improvements

4. **Security Scan**:
   - Submit code for security analysis
   - Get detailed security insights and vulnerability reports

5. **Pipeline Analysis**:
   - View and analyze your pipeline YAML
   - Get AI-powered suggestions for optimization
   - Generate new pipeline templates based on your needs

## Environment Variables

- `AZURE_PAT`: Your Azure DevOps Personal Access Token
- `AZURE_ORG`: Your Azure DevOps Organization URL
- `API_KEY`: Your Gemini API Key for AI capabilities

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

MIT License
