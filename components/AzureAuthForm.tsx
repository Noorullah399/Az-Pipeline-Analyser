/// <reference types="react" />
import React, { useState } from 'react';
import { AzureCredentials } from '../types';
import { AzureIcon } from './icons/AzureIcon';

interface AzureAuthFormProps {
  onSubmit: (credentials: AzureCredentials) => void;
  isLoading: boolean;
  initialCreds: AzureCredentials;
}

export const AzureAuthForm: React.FC<AzureAuthFormProps> = ({ onSubmit, isLoading, initialCreds }) => {
  const [pat, setPat] = useState(initialCreds.pat);
  const [orgUrl, setOrgUrl] = useState(initialCreds.orgUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ pat, orgUrl });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-2xl">
      <div className="flex items-center justify-center mb-6">
        <AzureIcon className="w-10 h-10 text-brand-primary mr-3" />
        <h2 className="text-2xl font-semibold text-neutral-dark">Connect to Azure DevOps</h2>
      </div>
      <p className="text-sm text-neutral-medium mb-4 text-center">
        Enter your Personal Access Token (PAT) and Organization URL.
        <br />
        <strong className="text-orange-600">Note:</strong> PAT is handled in-memory for this demo and not stored securely.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="orgUrl" className="block text-sm font-medium text-neutral-dark">
            Organization URL
          </label>
          <input
            type="text"
            id="orgUrl"
            value={orgUrl}
            onChange={(e) => setOrgUrl(e.target.value)}
            placeholder="https://dev.azure.com/YourOrganization"
            required
            className="mt-1 block w-full px-3 py-2 border border-neutral-medium rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="pat" className="block text-sm font-medium text-neutral-dark">
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            id="pat"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            placeholder="Enter your PAT"
            required
            className="mt-1 block w-full px-3 py-2 border border-neutral-medium rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
          />
           <p className="mt-1 text-xs text-neutral-medium">Ensure PAT has permissions for Code (Read), Build (Read), and Project & Team (Read).</p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition-colors duration-150"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </form>
    </div>
  );
};