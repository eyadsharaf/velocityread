import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

/**
 * Layout floor promised in PRODUCT.md: everything must hold at 375px.
 * Runs in the `mobile` project (375×667, touch, mobile emulation).
 */
test.describe('Feature: Mobile Layout (375px)', () => {
  let library: LibraryPage
  let reader: ReaderPage

  test.beforeEach(async ({ page }) => {
    library = new LibraryPage(page)
    reader = new ReaderPage(page)
    await library.goto()
    await library.expectEmptyState()
  })

  test('should import a book and show the reader at 375px', async ({ page }) => {
    await library.importFile('sample.txt')

    await reader.expectOpen('The')
    await expect(reader.textPanel).toBeVisible()
    await expect(reader.playButton).toBeVisible()
    await expect(reader.nextSentence).toBeVisible()

    await page.screenshot({ path: 'artifacts/mobile-reader-375.png' })
  })

  test('should have no horizontal overflow at 375px', async ({ page }) => {
    await library.importFile('sample.txt')
    await reader.expectOpen('The')

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('should tap the RSVP pane to play and pause', async ({ page }) => {
    await library.importFile('sample.txt')
    await reader.expectOpen('The')

    // Tapping the flashed word bubbles to the pane → play.
    await reader.rsvpWord.tap()
    await expect(reader.playButton).toHaveAccessibleName('Pause')
    await expect
      .poll(async () => (await reader.currentWord()) !== 'The', { timeout: 5_000 })
      .toBe(true)

    // Tap again → pause.
    await reader.rsvpWord.tap()
    await expect(reader.playButton).toHaveAccessibleName('Play')
  })

  test('should keep the full controls pill reachable at 375px', async ({ page }) => {
    await library.importFile('sample.txt')
    await reader.expectOpen('The')

    // Every control is visible and inside the viewport at 375px.
    for (const control of [
      reader.prevSentence,
      reader.playButton,
      reader.nextSentence,
      reader.slowerButton,
      reader.fasterButton,
      reader.settingsButton,
    ]) {
      await expect(control).toBeVisible()
      const box = await control.boundingBox()
      expect(box, 'control has a box').not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(375)
    }
  })
})
