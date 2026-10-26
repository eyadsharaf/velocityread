import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: Keyboard Shortcuts', () => {
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

  test('should toggle playback with Space', async ({ page }) => {
    await page.keyboard.press('Space')
    await expect(reader.playButton).toHaveAccessibleName('Pause')

    await page.keyboard.press('Space')
    await expect(reader.playButton).toHaveAccessibleName('Play')
  })

  test('should jump sentences with ArrowLeft / ArrowRight', async ({ page }) => {
    await page.keyboard.press('ArrowRight')
    await expect(reader.rsvpWord).toHaveText('Pack')

    await page.keyboard.press('ArrowRight')
    await expect(reader.rsvpWord).toHaveText('How')

    await page.keyboard.press('ArrowLeft')
    await expect(reader.rsvpWord).toHaveText('Pack')
  })

  test('should adjust speed with ArrowUp / ArrowDown', async ({ page }) => {
    await page.keyboard.press('ArrowUp')
    expect(await reader.wpm()).toBe(375)

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    expect(await reader.wpm()).toBe(325)
  })

  test('should not reduce WPM below the 50 floor via keyboard', async ({ page }) => {
    for (let i = 0; i < 14; i++) await page.keyboard.press('ArrowDown')
    expect(await reader.wpm()).toBe(50)
  })

  test('should exit to the library with Escape', async () => {
    await reader.page.keyboard.press('Escape')
    await library.expectLibraryCount(1)
    await expect(library.card('sample.txt')).toBeVisible()
  })
})
