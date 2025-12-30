import { expect, test } from "@playwright/test";

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ZcAAAAASUVORK5CYII=";

test("quota path: second generate blocked with upgrade prompt (mocked network)", async ({ page }) => {
  let count = 0;
  await page.route("**/api/generate", async (route) => {
    count += 1;
    if (count === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          posterPngUrl: `data:image/png;base64,${TINY_PNG_BASE64}`,
          posterPdfUrl: "data:application/pdf;base64,JVBERi0xLjQK"
        })
      });
      return;
    }
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "Daily quota exceeded." })
    });
  });

  await page.goto("/generate");
  await page.getByLabel("Prompt").fill("Draw a cat");

  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByRole("heading", { name: "Preview" })).toBeVisible();

  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByTestId("error-alert")).toContainText("quota");
  await expect(page.getByRole("link", { name: "Upgrade" })).toBeVisible();
});


