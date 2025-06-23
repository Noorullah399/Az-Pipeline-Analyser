
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private initializationError: Error | null = null;

  constructor() {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY environment variable is not set. Gemini features will be unavailable.");
      }
      this.ai = new GoogleGenAI({ apiKey });
      this.initializationError = null;
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI in GeminiService:", e);
      this.initializationError = e instanceof Error ? e : new Error(String(e));
      this.ai = null;
    }
  }

  public getInitializationError(): Error | null {
    return this.initializationError;
  }

  private ensureInitialized(): void {
    if (this.initializationError) {
      throw new Error(`GeminiService initialization failed: ${this.initializationError.message}`);
    }
    if (!this.ai) {
      // This case should ideally be covered by initializationError, but as a safeguard:
      throw new Error("GeminiService is not initialized (GoogleGenAI instance is null).");
    }
  }

  public async generateText(prompt: string): Promise<string> {
    this.ensureInitialized();
    if (!this.ai) throw new Error("Gemini AI service not available after check."); // Should not happen if ensureInitialized works

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
      });
      
      const text = response.text;
      if (text === undefined || text === null) {
          throw new Error("Received empty or invalid response from Gemini API.");
      }
      return text;

    } catch (error) {
      console.error("Error calling Gemini API (generateText):", error);
      if (error instanceof Error) {
        // Augment existing error message if it's a general one, or keep specific Gemini errors.
        if (this.initializationError && error.message.includes("GeminiService")) {
             throw error; // rethrow if it's already a service level error
        }
        throw new Error(`Gemini API error during generateText: ${error.message}`);
      }
      throw new Error("An unknown error occurred with the Gemini API during generateText.");
    }
  }

  public async generateTextWithJsonOutput(prompt: string, jsonSchema?: object): Promise<any> {
    this.ensureInitialized();
    if (!this.ai) throw new Error("Gemini AI service not available after check."); // Should not happen

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      try {
        const parsedData = JSON.parse(jsonStr);
        return parsedData;
      } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", e, "\nRaw response:", jsonStr);
        throw new Error(`Failed to parse JSON response: ${(e as Error).message}. Raw response: ${jsonStr.substring(0,1000)}`);
      }

    } catch (error) {
      console.error("Error calling Gemini API for JSON (generateTextWithJsonOutput):", error);
       if (error instanceof Error) {
         if (this.initializationError && error.message.includes("GeminiService")) {
             throw error;
        }
        throw new Error(`Gemini API error during generateTextWithJsonOutput: ${error.message}`);
      }
      throw new Error("An unknown error occurred with the Gemini API during generateTextWithJsonOutput.");
    }
  }
}
