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

  test("journey timeline shows segment time (นาที) in expanded card", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");
    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1500);

    // First card is auto-expanded; timeline should show segment time in นาที and a line operator code
    await expect(page.locator("text=นาที").first()).toBeVisible({ timeout: 10_000 });
    const hasBts = await page.locator("text=BTS").count();
    const hasMrt = await page.locator("text=MRT").count();
    expect(hasBts + hasMrt).toBeGreaterThan(0);
    // Total time summary row
    await expect(page.locator("text=เวลาเดินทางรวม").first()).toBeVisible({ timeout: 10_000 });
  });

  test("journey timeline shows transfer walk time for route with transfer", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    // หมอชิต (BTS) → พระราม 9 (MRT) requires a transfer
    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "พระราม 9");
    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1500);

    // Should show transfer indicator with walk time (~X นาที)
    await expect(page.locator("text=เปลี่ยน").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=นาที").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=เวลาเดินทางรวม").first()).toBeVisible({ timeout: 10_000 });
  });

  test("compact bar shown on desktop after search", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");
    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1500);

    // Compact bar should appear with ✏️ เปลี่ยน button
    await expect(page.locator("text=✏️ เปลี่ยน").first()).toBeVisible({ timeout: 10_000 });
  });

  test("URL has ?from= and ?to= params after search", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");
    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1500);

    const url = page.url();
    expect(url).toContain("from=");
    expect(url).toContain("to=");
  });

  test("share button shows URL panel with copy button", async ({ page, isMobile }) => {
    if (isMobile) test.skip();
    await page.goto("/");
    await waitForAppReady(page);

    await selectStation(page, "picker-origin", "หมอชิต");
    await selectStation(page, "picker-destination", "สีลม");
    await page.locator('[data-testid="search-button"]').click();
    await page.waitForTimeout(1500);

    // Share button should appear
    const shareBtn = page.locator("text=📤 แชร์เส้นทางนี้").first();
    await expect(shareBtn).toBeVisible({ timeout: 10_000 });

    // Click to open share panel
    await shareBtn.click();

    // Copy button and URL input should appear
    await expect(page.locator("text=📋 คัดลอก").first()).toBeVisible();
    const input = page.locator("input[readonly]").first();
    const value = await input.inputValue();
    expect(value).toContain("from=");
  });
});

