import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: Settings', () => {
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

  test('should open the settings popover and mark the gear as expanded', async () => {
    await reader.openSettings()

    await expect(reader.settingsDialog).toBeVisible()
    await expect(reader.settingsButton).toHaveAttribute('aria-expanded', 'true')

    // All five control groups are present.
    const dialog = reader.settingsDialog
    await expect(dialog.getByText('Theme')).toBeVisible()
    await expect(dialog.getByText('Word size')).toBeVisible()
    await expect(dialog.getByText('Text size')).toBeVisible()
    await expect(dialog.getByRole('switch', { name: 'Focus mode' })).toBeVisible()
    await expect(dialog.getByRole('switch', { name: 'Pacing pauses' })).toBeVisible()
  })

  test('should close the settings popover with Escape (and stay in the reader)', async ({ page }) => {
    await reader.openSettings()
    await page.keyboard.press('Escape')
    await expect(reader.settingsDialog).toHaveCount(0)
    await expect(reader.rsvpWord).toBeVisible() // Escape did NOT exit the book
  })

  test('should close the settings popover on outside click', async () => {
    await reader.openSettings()
    await reader.page.mouse.click(40, 100) // far from the popover
    await expect(reader.settingsDialog).toHaveCount(0)
  })

  test('should switch the theme to light and back to dark', async ({ page }) => {
    await reader.openSettings()
    await page.getByRole('button', { name: 'Light theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.getByRole('button', { name: 'Dark theme' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('should toggle focus mode and collapse the text pane', async ({ page }) => {
    await expect(reader.textPanel).toBeVisible()

    await reader.openSettings()
    await page.getByRole('switch', { name: 'Focus mode' }).click()

    await expect(reader.textPanel).toHaveCount(0) // pane unmounts in focus mode
    await expect(reader.rsvpWord).toBeVisible()

    // Toggle back — the pane returns.
    await page.getByRole('switch', { name: 'Focus mode' }).click()
    await expect(reader.textPanel).toBeVisible()
  })

  test('should change the RSVP word size via the segmented control', async ({ page }) => {
    await reader.openSettings()
    await page.getByRole('button', { name: 'Extra large word size' }).click()

    const scale = await reader.page
      .locator('div[style*="rsvp-scale"]')
      .evaluate((el) => el.style.getPropertyValue('--rsvp-scale'))
    expect(scale).toBe('1.3')
  })

  test('should change the reading pane text size', async ({ page }) => {
    await reader.openSettings()
    await page.getByRole('button', { name: 'Large text size' }).click()

    await expect(reader.textPanel).toHaveAttribute('style', /--reader-font-size:\s*18px/)
  })

  test('should toggle pacing pauses off and on', async ({ page }) => {
    await reader.openSettings()
    const pacing = page.getByRole('switch', { name: 'Pacing pauses' })
    await expect(pacing).toHaveAttribute('aria-checked', 'true')

    await pacing.click()
    await expect(pacing).toHaveAttribute('aria-checked', 'false')

    await pacing.click()
    await expect(pacing).toHaveAttribute('aria-checked', 'true')
  })
})
