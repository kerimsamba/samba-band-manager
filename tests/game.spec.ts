import { expect, test } from "@playwright/test";
import { createGame } from "../src/game/engine";

const firstRosterMember = (page: import("@playwright/test").Page) =>
  page.locator(".roster-row:not(.roster-header)").first();

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Big rhythms. Beautiful chaos." }),
  ).toBeVisible();
});

test("shows the default clubhouse hero and launches the due gig", async ({
  page,
}) => {
  await expect(page.getByText("WEEK 01")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kelvingrove Summer Social" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finish weekly turn" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Finish weekly turn" }).click();
  await expect(
    page.getByRole("dialog", { name: "Kelvingrove Summer Social" }),
  ).toBeVisible();
  await expect(page.getByText("How are we playing this?")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Take the stage" }),
  ).toBeVisible();
});

test("plays the gig, skips once, and persists one reward through reload", async ({
  page,
}) => {
  const balance = page
    .locator(".stat-card")
    .filter({ hasText: "Band balance" })
    .locator(".stat-value");
  const before = await balance.textContent();

  await page.getByRole("button", { name: "Finish weekly turn" }).click();
  await page.getByRole("button", { name: "Go all out" }).click();
  const speed = page.getByRole("button", { name: "Change playback speed" });
  await speed.click();
  await speed.click();
  await page.getByRole("button", { name: "Take the stage" }).click();
  await expect(
    page.getByText("The groove is rolling. What’s your call?"),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Bring it together" }).click();
  await page.getByRole("button", { name: "Cue the band" }).click();
  await expect(
    page.getByText("They’re with you. How do you finish?"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stick the landing" }).click();
  await page.getByRole("button", { name: "Bring it home" }).click();

  await page.getByRole("button", { name: /Skip to result/ }).click();
  await expect(
    page.getByRole("heading", { name: "That’s a wrap!" }),
  ).toBeVisible();
  await expect(page.getByText(/Net gig income/)).toBeVisible();
  const after = await balance.textContent();
  expect(after).not.toBe(before);

  await page.getByRole("button", { name: "Back to week events" }).click();
  await page.getByRole("button", { name: "Gigs & calendar" }).click();
  await expect(page.locator(".gig-history .history-row")).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Gigs & calendar", exact: true })
    .click();
  await expect(page.locator(".gig-history .history-row")).toHaveCount(1);
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "Band balance" })
      .locator(".stat-value"),
  ).toHaveText(after || "");
});

test("books and releases a future diary event", async ({ page }) => {
  await page.getByRole("button", { name: "Gigs & calendar" }).click();
  const futureCard = page.locator(".gig-card").nth(1);
  await expect(futureCard).toBeVisible();
  await expect(
    futureCard.getByRole("button", { name: "Put it in the diary" }),
  ).toBeVisible();
  await futureCard.getByRole("button", { name: "Put it in the diary" }).click();
  await expect(
    futureCard.getByRole("button", { name: "Release" }),
  ).toBeVisible();
  await futureCard.getByRole("button", { name: "Release" }).click();
  await expect(
    futureCard.getByRole("button", { name: "Put it in the diary" }),
  ).toBeVisible();
});

test("runs rehearsal once per weekly turn", async ({ page }) => {
  await page
    .getByRole("button", { name: "Rehearsal room", exact: true })
    .click();
  await page.getByRole("button", { name: "Put on a show" }).click();
  const run = page.getByRole("button", { name: /Run rehearsal/ });
  await expect(run).toBeEnabled();
  await run.click();
  await expect(
    page.getByRole("button", { name: "Session complete" }),
  ).toBeDisabled();
  await expect(
    page.getByText("A good session. The band is feeling it."),
  ).toBeVisible();
});

test("recruitment deducts the fee and adds players", async ({ page }) => {
  await page.getByRole("button", { name: "The band", exact: true }).click();
  const rows = page.locator(".roster-row:not(.roster-header)");
  await expect(rows).toHaveCount(30);
  await page.getByRole("button", { name: /Recruit · £100/ }).click();
  await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(31);
  expect(await rows.count()).toBeLessThanOrEqual(33);
  await expect(
    page
      .locator(".stat-card")
      .filter({ hasText: "Band balance" })
      .locator(".stat-value"),
  ).toContainText("£2,300");
  await expect(
    page.getByText("Fresh faces in the rehearsal room. Welcome to the band!"),
  ).toBeVisible();
});

test("searches the roster and starts member training", async ({ page }) => {
  await page.getByRole("button", { name: "The band", exact: true }).click();
  const first = firstRosterMember(page);
  const name = (
    await first.locator(".player-cell strong").textContent()
  )?.trim();
  expect(name).toBeTruthy();
  await page.getByLabel("Search band members").fill(name!);
  await expect(
    page.locator(".roster-row:not(.roster-header)").first(),
  ).toBeVisible();
  await first.click();
  const dialog = page.getByRole("dialog", { name: "A face behind the rhythm" });
  await expect(dialog).toBeVisible();
  const trainingButton = dialog.locator(".training-buttons button").first();
  await expect(trainingButton).toBeEnabled();
  await trainingButton.click();
  await expect(dialog.getByText("Learning a new instrument")).toBeVisible();
  await expect(dialog.getByText(/weeks remaining/)).toBeVisible();
});

test("blocks advancing until the due gig is launched, then advances after resolution", async ({
  page,
}) => {
  await expect(page.getByText("WEEK 01")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Finish weekly turn" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Finish weekly turn" }).click();
  await expect(
    page.getByRole("dialog", { name: "Kelvingrove Summer Social" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByText("WEEK 01")).toBeVisible();

  await page.getByRole("button", { name: "Play next gig" }).click();
  const speed = page.getByRole("button", { name: "Change playback speed" });
  await speed.click();
  await speed.click();
  await page.getByRole("button", { name: "Take the stage" }).click();
  await page.getByRole("button", { name: "Cue the band" }).click();
  await page.getByRole("button", { name: "Bring it home" }).click();
  await page.getByRole("button", { name: /Skip to result/ }).click();
  await page.getByRole("button", { name: "Back to week events" }).click();
  await page.getByRole("button", { name: "Start next week" }).click();
  await expect(page.getByText("WEEK 02")).toBeVisible();
});

test("settings rejects a corrupted upload and restores a valid save", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Open manager settings" }).click();
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "corrupt.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not valid json"),
  });
  await expect(
    page.getByText("This is not a valid Samba Social v2 save."),
  ).toBeVisible();

  const save = await page.evaluate(() =>
    localStorage.getItem("sambaSocial_v2"),
  );
  expect(save).toBeTruthy();
  await fileInput.setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(save!),
  });
  await expect(
    page.getByText("Welcome back. Your band is right where you left it."),
  ).toBeVisible();
});

test("mobile: has no horizontal overflow at 390px", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
});

test("pauses between cues and resumes the unfinished show after closing", async ({
  page,
}) => {
  await page.clock.install();
  await page.getByRole("button", { name: "Finish weekly turn" }).click();
  await page.getByRole("button", { name: "Take the stage" }).click();
  await page.clock.runFor(1_800);
  await page.getByRole("button", { name: "Pause show" }).click();
  const meter = page.locator(".live-timeline .meter i");
  const pausedWidth = await meter.getAttribute("style");
  await page.clock.runFor(4_000);
  await expect(meter).toHaveAttribute("style", pausedWidth!);
  await expect(page.getByRole("button", { name: "Resume show" })).toBeEnabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Play next gig" }).click();
  await expect(meter).toHaveAttribute("style", pausedWidth!);
  await page.getByRole("button", { name: "Resume show" }).click();
  await page.clock.runFor(11_000);
  await expect(
    page.getByRole("button", { name: "Cue the band" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resume show" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cue the band" }).click();
  await page.clock.runFor(1_000);
  await page.getByRole("button", { name: "Pause show" }).click();
  await expect(page.getByRole("button", { name: "Resume show" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Cue the band" })).toHaveCount(
    0,
  );
});

test("the animated performers stay distributed across the stage", async ({
  page,
}) => {
  const positions = await page
    .locator(".gig-hero .gig-performer")
    .evaluateAll((elements) =>
      elements.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y };
      }),
    );
  expect(positions).toHaveLength(11);
  expect(
    Math.max(...positions.map((p) => p.x)) -
      Math.min(...positions.map((p) => p.x)),
  ).toBeGreaterThan(150);
  const stage = await page.locator(".gig-hero .gig-stage").boundingBox();
  expect(stage).not.toBeNull();
  for (const p of positions) {
    expect(p.x).toBeGreaterThan(stage!.x);
    expect(p.y).toBeGreaterThan(stage!.y);
    expect(p.y).toBeLessThan(stage!.y + stage!.height);
  }
});

test("mobile: all management screens and gig decisions fit the viewport", async ({
  page,
}) => {
  for (const name of [
    "The band",
    "Gigs & calendar",
    "Rehearsal room",
    "Finances",
    "Band journal",
    "Clubhouse",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    const widths = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(widths[0], name).toBeLessThanOrEqual(widths[1] + 1);
  }
  await page.getByRole("button", { name: "Open manager settings" }).click();
  await expect(
    page.getByRole("button", { name: "Download save" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Finish weekly turn" }).click();
  await expect(
    page.getByRole("button", { name: "Take the stage" }),
  ).toBeVisible();
  const widths = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  expect(widths[0]).toBeLessThanOrEqual(widths[1] + 1);
});

test("mobile: two gigs are intermediate events between weekly planning turns", async ({
  page,
}) => {
  const state = createGame(9);
  state.gigs.push({
    ...state.gigs[0],
    id: "second-show",
    name: "Sunday Samba",
    day: "Sunday",
  });
  await page.evaluate(
    (save) => localStorage.setItem("sambaSocial_v2", JSON.stringify(save)),
    state,
  );
  await page.reload();
  await page.clock.install();
  const home = page.locator(".home-actions");
  await expect(home.getByRole("button")).toHaveCount(7); // six equal choices plus help
  await expect(home).not.toContainText(/recommend|suggest/i);
  await home.getByRole("button", { name: "Rehearse", exact: true }).click();
  await page.getByRole("button", { name: /Run rehearsal/ }).click();
  await page.getByRole("button", { name: "Clubhouse", exact: true }).click();
  await expect(
    home.getByRole("button", { name: "Rehearse", exact: true }),
  ).toContainText("Done this week");
  await home.getByRole("button", { name: "Finish weekly turn" }).click();
  const completeShow = async () => {
    await page.getByRole("button", { name: "Take the stage" }).click();
    await page.clock.runFor(12_000);
    await page.getByRole("button", { name: "Cue the band" }).click();
    await page.clock.runFor(12_000);
    await page.getByRole("button", { name: "Bring it home" }).click();
    await page.getByRole("button", { name: /Skip to result/ }).click();
    await page.getByRole("button", { name: "Back to week events" }).click();
  };
  await completeShow();
  await expect(page.getByText("WEEK 01")).toBeVisible();
  await expect(home).toContainText("Sunday Samba");
  await expect(home).toContainText("1 show played this week");
  await expect(
    home.getByRole("button", { name: "Start next week" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(home).toContainText("GIG EVENTS");
  await page.getByRole("button", { name: "The band", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Recruit · £100/ }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Gigs & calendar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enter gig day" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Put it in the diary" }).first(),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Clubhouse", exact: true }).click();
  await home.getByRole("button", { name: "Play next gig" }).click();
  await completeShow();
  await expect(page.getByText("WEEK 01")).toBeVisible();
  await expect(home).toContainText("2 shows played this week");
  await home.getByRole("button", { name: "Start next week" }).click();
  await expect(page.getByText("WEEK 02")).toBeVisible();
  await expect(home).toContainText("PLANNING");
  await page.getByRole("button", { name: "Rehearse", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Run rehearsal/ }),
  ).toBeEnabled();
});

for (const width of [320, 390, 430]) {
  test(`mobile: readable touch controls and layouts at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "Clubhouse",
      "The band",
      "Gigs & calendar",
      "Rehearsal room",
      "Finances",
      "Band journal",
    ]) {
      await page.getByRole("button", { name, exact: true }).click();
      const sizes = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
        buttons: [
          ...document.querySelectorAll(
            ".button, .nav-item, .icon-button, .home-action",
          ),
        ]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .map((e) => ({
            height: e.getBoundingClientRect().height,
            label: e.textContent,
          })),
      }));
      expect(sizes.page, name).toBeLessThanOrEqual(sizes.viewport + 1);
      for (const button of sizes.buttons)
        expect(button.height, button.label || name).toBeGreaterThanOrEqual(44);
      if (name === "The band") {
        await expect(
          firstRosterMember(page).getByText("Reliability", { exact: true }),
        ).toBeVisible();
        expect(
          await firstRosterMember(page)
            .locator(".player-cell strong")
            .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
        ).toBeGreaterThanOrEqual(16);
      }
      if (
        testInfo.project.name === "mobile" &&
        width === 390 &&
        ["Clubhouse", "The band"].includes(name)
      ) {
        await page.screenshot({
          path: testInfo.outputPath(`${name}.png`),
          fullPage: name === "Clubhouse",
        });
      }
    }
    await page.getByRole("button", { name: "Clubhouse", exact: true }).click();
    await page.getByRole("button", { name: "Finish weekly turn" }).click();
    const dialog = page.getByRole("dialog");
    expect(
      await dialog.evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      await page
        .locator(".decision-card strong")
        .first()
        .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
    ).toBeGreaterThanOrEqual(18);
    if (testInfo.project.name === "mobile" && width === 390) {
      await page.screenshot({ path: testInfo.outputPath("gig-decisions.png") });
    }
  });
}

test("home actions open invitations and this week’s bookings directly", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Book gigs", exact: true }).click();
  await expect(page.locator(".gig-card")).toHaveCount(3);
  await expect(page.locator(".segmented button.active")).toHaveText(
    "New offers",
  );
  await page.getByRole("button", { name: "Clubhouse", exact: true }).click();
  await page
    .getByRole("button", { name: "View this week", exact: true })
    .click();
  await expect(page.locator(".gig-card")).toHaveCount(1);
  await expect(page.locator(".segmented button.active")).toHaveText(
    "This week",
  );
  await expect(page.locator(".gig-card")).toContainText(
    "Kelvingrove Summer Social",
  );
});
