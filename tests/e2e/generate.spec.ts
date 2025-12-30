import { expect, test } from "@playwright/test";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZcAAAAASUVORK5CYII=";

test("happy path: generate shows preview and download buttons (mocked network)", async ({ page }) => {
  await page.route("**/api/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        posterPngUrl: `data:image/png;base64,${TINY_PNG_BASE64}`,
        posterPdfUrl: "data:application/pdf;base64,JVBERi0xLjQK"
      })
    });
  });

  await page.goto("/generate");
  await page.getByLabel("Prompt").fill("Draw a cat");
  await page.getByLabel("Style preset").selectOption("minimal_ink");

  await page.getByTestId("reference-image").setInputFiles({
    name: "ref.png",
    mimeType: "image/png",
    buffer: Buffer.from(TINY_PNG_BASE64, "base64")
  });

  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();
  await expect(page.getByAltText("Poster preview")).toBeVisible();
  await expect(page.getByTestId("download-png")).toBeVisible();
  await expect(page.getByTestId("download-pdf")).toBeVisible();
});


