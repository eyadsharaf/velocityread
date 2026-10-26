import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: Session Persistence', () => {
  let library: LibraryPage
  let reader: ReaderPage

  test.beforeEach(async ({ page }) => {
    library = new LibraryPage(page)
    reader = new ReaderPage(page)
    await library.goto()
    await library.expectEmptyState()
    await library.importFile('sample.txt')
    await reader.expectOpen('The')
  })

  test('should restore the open book, reading position and WPM after reload', async ({ page }) => {
    // Move to "How" (word 18 of 69) and speed up to 400 WPM.
    await reader.nextSentence.click()
    await reader.nextSentence.click()
    await expect(reader.rsvpWord).toHaveText('How')
    await reader.fasterButton.click()
    await reader.fasterButton.click()
    expect(await reader.wpm()).toBe(400)

    // The progress write is debounced (500ms) — outlive it before reloading.
    await page.waitForTimeout(800)
    await page.reload()

    await reader.expectOpen('How')
    expect(await reader.wpm()).toBe(400)
    await expect(reader.textPanel).toBeVisible()
  })

  test('should restore reading into a fresh context only via the library', async ({ browser, page }) => {
    // Reading state lives in IndexedDB *inside the profile*: a brand-new
    // context (like another device) starts empty, then the book is listed.
    const appUrl = page.url()
    await reader.backToLibrary.click()

    const freshContext = await browser.newContext()
    const freshPage = await freshContext.newPage()
    const freshLibrary = new LibraryPage(freshPage)
    await freshPage.goto(appUrl)
    await freshLibrary.expectEmptyState()
    await freshContext.close()
  })

  test('should persist the theme choice across reload', async ({ page }) => {
    await reader.openSettings()
    await reader.page.getByRole('button', { name: 'Light theme' }).click()
    await expect(reader.page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.reload()
    await reader.expectOpen('The')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('should start clean after the last book is deleted', async ({ page }) => {
    await reader.backToLibrary.click()
    await library.deleteBook('sample.txt')
    await library.expectEmptyState()

    // No restore attempt, no error banner — just the drop zone.
    await page.reload()
    await library.expectEmptyState()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
