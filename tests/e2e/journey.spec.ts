import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

/**
 * Documents the happy-path journey with screenshots + a full video.
 * Chromium-only: the artifacts are for the human report, not cross-browser
 * verification.
 */
test.use({ video: 'on' })

test.describe('Feature: Reading Journey (artifacts)', () => {
  let library: LibraryPage
  let reader: ReaderPage
  const shots = 'artifacts'

  test.beforeEach(async ({ page }) => {
    mkdirSync(shots, { recursive: true })
    test.skip(
      page.context().browser()?.browserType().name() !== 'chromium',
      'Artifacts are captured once, on desktop Chromium'
    )
    library = new LibraryPage(page)
    reader = new ReaderPage(page)
  })

  test('should walk the full journey: import → read → library → resume', async ({ page }) => {
    await library.goto()
    await library.expectEmptyState()
    await page.screenshot({ path: `${shots}/01-empty-state.png` })

    await library.importFile('sample.txt')
    await reader.expectOpen('The')
    await expect(reader.orpChar).toHaveText('h')
    await page.screenshot({ path: `${shots}/02-reader-paused.png` })

    await reader.play()
    await expect(reader.playButton).toHaveAccessibleName('Pause')
    await expect
      .poll(async () => (await reader.currentWord()) !== 'The', { timeout: 5_000 })
      .toBe(true)
    await page.screenshot({ path: `${shots}/03-reader-playing.png` })
    await reader.pause()

    await reader.openSettings()
    await expect(reader.settingsDialog).toBeVisible()
    await page.screenshot({ path: `${shots}/04-settings-popover.png` })

    await page.getByRole('button', { name: 'Light theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.screenshot({ path: `${shots}/05-light-theme.png` })
    await page.keyboard.press('Escape')

    // Sentence navigation, then park at "How" and leave.
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(reader.rsvpWord).toHaveText('How')
    await page.waitForTimeout(800) // let the debounced progress write land

    await reader.backToLibrary.click()
    await library.expectLibraryCount(1)
    await expect(library.card('sample.txt').getByText('26% read')).toBeVisible()
    await page.screenshot({ path: `${shots}/06-library-with-progress.png` })

    // Resume from the card.
    await library.openBook('sample.txt')
    await reader.expectOpen('How')
    await page.screenshot({ path: `${shots}/07-resumed.png` })
  })
})
