import { test, expect, type Page } from "@playwright/test";

// Helper: wait for stations to load (supabase fetch)
async function waitForAppReady(page: Page) {
  await page.waitForSelector("text=สถานี", { timeout: 15_000 });
}

// Helper: open and select a station from StationPicker (testId: "picker-origin" or "picker-destination")
async function selectStation(page: Page, testId: string, stationName: string) {
  await page.locator(`[data-testid="${testId}"]`).click();
  await page.waitForSelector('input[placeholder*="ชื่อไทย"]', { timeout: 5_000 });
  const input = page.locator('input[placeholder*="ชื่อไทย"]').first();
  await input.fill(stationName);
  await page.waitForSelector(`text=${stationName}`, { timeout: 5_000 });
  await page.locator(`text=${stationName}`).first().click();
}

test.describe("Page loads correctly", () => {
  test("shows header and search UI", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.locator("text=Bangkok Transit Unified")).toBeVisible();
    await expect(page.locator("text=🟢 ต้นทาง").first()).toBeVisible();
    await expect(page.locator("text=🔴 ปลายทาง").first()).toBeVisible();
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible();
  });
});

test.describe("Map visibility", () => {
  test("desktop: map is visible without toggle", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);
    // Desktop map container (hidden md:flex → visible on desktop)
    // Map renders in the flex-1 div; check leaflet container appears
    const mapContainer = page.locator(".leaflet-container").first();
    await expect(mapContainer).toBeVisible({ timeout: 10_000 });
  });

  test("mobile: FAB button is visible", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);
    const mapFab = page.locator('button:has-text("แผนที่")');
    await expect(mapFab).toBeVisible();
  });

  test("mobile: FAB opens and closes map overlay", async ({ page, isMobile }) => {
    if (!isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    // Map overlay should not exist initially
    await expect(page.locator('[data-testid="map-overlay"]')).not.toBeVisible();

    // Tap FAB to open
    await page.locator('button:has-text("แผนที่")').click();
    await expect(page.locator('[data-testid="map-overlay"]')).toBeVisible();

    // Tap ✕ to close (inside overlay, not the FAB)
    await page.locator('[data-testid="map-overlay"] button[aria-label="ปิดแผนที่"]').click();
    await expect(page.locator('[data-testid="map-overlay"]')).not.toBeVisible();
  });
});

test.describe("Route search", () => {
  test("search button is disabled without selections", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    const searchBtn = page.locator('[data-testid="search-button"]');
    await expect(searchBtn).toBeDisabled();
  });

  test("shows empty state before search", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.locator("text=เลือกสถานีต้นทางและปลายทาง")).toBeVisible();
  });
});

test.describe("Route results", () => {
  test("route cards appear after search (desktop)", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    // Select หมอชิต → สีลม (known multi-route pair)
    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");

    await page.locator('[data-testid="search-button"]').click();

    // Should show at least one route option with fare
    await expect(page.locator("text=เส้นทาง").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=฿").first()).toBeVisible();
  });

  test("route card can be expanded to see station list", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");

    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1000);

    // First card auto-expanded: should see ต้นทาง/ปลายทาง labels
    await expect(page.locator("text=ต้นทาง").last()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=ปลายทาง").last()).toBeVisible({ timeout: 10_000 });
  });
});

