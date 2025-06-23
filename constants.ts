import { AzureCredentials } from './types';

export const INITIAL_AZURE_CREDENTIALS: AzureCredentials = {
  pat: '',
  orgUrl: '',
};

// Gemini Model Names
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_MODEL_IMAGE_GEN = 'imagen-3.0-generate-002'; // Not used in this app, but good to list
