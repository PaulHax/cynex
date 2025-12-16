import { test, expect } from "@playwright/test";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

test.describe("Trajectory Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows trajectory dropdown with available files", async ({ page }) => {
    const dropdown = page.getByRole("combobox");
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText("hosts15-ppo-E0");
  });

  test("shows load file button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Load File..." })).toBeVisible();
  });

  test("shows drag-and-drop zone", async ({ page }) => {
    await expect(page.getByText("or drag JSON")).toBeVisible();
  });

  test("loads default trajectory on startup", async ({ page }) => {
    await expect(page.getByText("PPO agent vs RedMeanderAgent_Resilience")).toBeVisible();
  });

  test("load file via file picker", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Load File..." }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(resolve(__dirname, "../public/data/trajectories/hosts15-ppo-E0.json"));

    await expect(page.getByText("PPO agent vs RedMeanderAgent_Resilience")).toBeVisible();
  });

  test("selecting trajectory from dropdown resets step to 0", async ({ page }) => {
    await page.getByRole("button", { name: "▶|" }).click();
    await expect(page.locator("div").filter({ hasText: /^Step 100 \/ 100$/ })).toBeVisible();

    const dropdown = page.getByRole("combobox");
    await dropdown.selectOption("hosts15-ppo-E0.json");

    await expect(page.locator("div").filter({ hasText: /^Step 1 \/ 100$/ })).toBeVisible();
  });

  test("invalid file shows error", async ({ page }) => {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Load File..." }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(resolve(__dirname, "../package.json"));

    await expect(page.getByText("Invalid trajectory file format")).toBeVisible();
  });

  test("drag zone highlights on drag over", async ({ page }) => {
    const dropZone = page.getByText("or drag JSON");

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await dropZone.dispatchEvent("dragover", { dataTransfer });

    await expect(page.getByText("Drop here")).toBeVisible();
  });
});
