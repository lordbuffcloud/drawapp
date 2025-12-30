export type StepImage = { step: number; pngBase64: string };

// This module is intentionally mockable in tests.
// Real OpenAI integration will be implemented in the MVP feature pass.
export async function generateStepImages(_opts: {
  prompt: string;
  stylePreset: string;
  customStyle?: string;
  referenceImageBase64?: string;
}): Promise<StepImage[]> {
  throw new Error("OpenAI not configured (mock generateStepImages in tests).");
}


