import OpenAI from "openai";
import { getServerEnv } from "./env";

export type StepImage = { step: number; pngBase64: string };

function stylePresetToPrompt(stylePreset: string): string {
  switch (stylePreset) {
    case "street_art":
      return "street-art inspired linework, gritty but clean, high contrast ink lines";
    case "contemporary":
      return "contemporary illustration, clean lines, tasteful shading, minimal texture";
    case "minimal_ink":
      return "minimal ink drawing, crisp black line art, very sparse shading";
    case "manga":
      return "manga-style line art, clear contours, simple screentone shading";
    case "custom":
      return "custom illustration style";
    default:
      return "minimal ink drawing, crisp line art";
  }
}

function stepPrompt(opts: { prompt: string; stylePreset: string; customStyle?: string; step: number }): string {
  const style = stylePresetToPrompt(opts.stylePreset);
  const custom = opts.customStyle?.trim() ? ` Custom style notes: ${opts.customStyle.trim()}` : "";
  return [
    `Create an image for a drawing tutorial.`,
    `Subject: ${opts.prompt}`,
    `This is Step ${opts.step} of 7.`,
    `Each step should show incremental progress from simple shapes to a finished drawing.`,
    `Keep the subject centered, consistent scale and pose across steps.`,
    `No text, no labels, no watermark, no frame.`,
    `Prefer transparent background if supported; otherwise plain white background.`,
    `Style: ${style}.${custom}`
  ].join("\n");
}

// This module remains intentionally mockable in tests.
export async function generateStepImages(opts: {
  prompt: string;
  stylePreset: string;
  customStyle?: string;
  referenceImageBase64?: string;
}): Promise<StepImage[]> {
  const env = getServerEnv();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

  const out: StepImage[] = [];
  for (let step = 1; step <= 7; step++) {
    const res = await client.images.generate({
      model,
      prompt: stepPrompt({ prompt: opts.prompt, stylePreset: opts.stylePreset, customStyle: opts.customStyle, step }),
      size: "1024x1024"
    });
    const b64 = (res.data?.[0] as unknown as { b64_json?: string })?.b64_json;
    if (!b64) throw new Error("OpenAI image generation returned no b64.");
    out.push({ step, pngBase64: b64 });
  }
  return out;
}


