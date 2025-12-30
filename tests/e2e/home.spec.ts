import { expect, test } from "@playwright/test";

test("home is an intentional hero (no duplicate nav list in content)", async ({ page }) => {
  await page.goto("/");

  const content = page.locator(".contentInner");
  await expect(content.locator("h1")).toHaveText("drawapp");
  await expect(content.getByText("Printable step-by-step drawing tutorial posters.")).toBeVisible();

  await expect(content.getByRole("link", { name: "Generate" })).toBeVisible();
  await expect(content.getByRole("link", { name: "Gallery" })).toBeVisible();
  await expect(content.getByRole("link", { name: "Go Pro" })).toBeVisible();

  // The sidebar uses a list; the home content should not repeat nav links as a bullet list.
  await expect(content.locator("ul")).toHaveCount(0);
});


