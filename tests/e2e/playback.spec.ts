import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: RSVP Playback', () => {
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

  test('should start paused on the first word with the ORP letter highlighted', async () => {
    // "The" is 3 chars → ORP index 1 → "h" is the accent-colored pivot.
    await expect(reader.orpChar).toHaveText('h')
    await expect(reader.orpChar).toHaveClass(/text-accent/)
    await expect(reader.playButton).toBeVisible() // paused → "Play"
    await expect(reader.textPanel.locator('.caret-blink')).toBeVisible()
  })

  test('should advance words while playing and freeze when paused', async ({ page }) => {
    await reader.play()
    await expect(reader.playButton).toHaveAccessibleName('Pause')

    // Word leaves the first word within a couple of seconds at 350 WPM.
    await expect
      .poll(async () => (await reader.currentWord()) !== 'The', { timeout: 5_000 })
      .toBe(true)

    await reader.pause()
    await expect(reader.playButton).toHaveAccessibleName('Play')

    // Frozen: the word does not change over time while paused.
    const frozen = await reader.currentWord()
    await page.waitForTimeout(500) // observation window, not a wait-for-condition
    expect(await reader.currentWord()).toBe(frozen)
  })

  test('should advance the progress bar during playback', async () => {
    expect(await reader.progressPercent()).toBeLessThan(2) // word 1 of 69

    await reader.play()
    await expect
      .poll(async () => reader.progressPercent(), { timeout: 5_000 })
      .toBeGreaterThan(3)

    // Progress bar is in sync with the word position: (index + 1) / 69.
    const pct = await reader.progressPercent()
    expect(pct).toBeLessThanOrEqual(100)
  })

  test('should jump between sentences with the transport controls', async () => {
    // sample.txt sentence starts: The(0) Pack(9) How(17) Sphinx(23) ...
    await reader.nextSentence.click()
    await expect(reader.rsvpWord).toHaveText('Pack')
    await reader.nextSentence.click()
    await expect(reader.rsvpWord).toHaveText('How')

    await reader.prevSentence.click()
    await expect(reader.rsvpWord).toHaveText('Pack')
  })

  test('should change speed with the WPM buttons and pulse the new value', async () => {
    expect(await reader.wpm()).toBe(350)

    await reader.fasterButton.click()
    await expect(reader.page.locator('.wpm-pulse')).toHaveText(/375/)
    expect(await reader.wpm()).toBe(375)

    await reader.slowerButton.click()
    await reader.slowerButton.click()
    expect(await reader.wpm()).toBe(325)
  })

  test('should stop playback at the end of the document', async ({ page }) => {
    // Jump deep into the last sentence, then play through the few remaining
    // words — the RSVP loop auto-pauses at the end.
    await page.getByRole('button', { name: 'Next sentence' }).click() // Pack
    await page.getByRole('button', { name: 'Next sentence' }).click() // How
    await page.getByRole('button', { name: 'Next sentence' }).click() // Sphinx
    await page.getByRole('button', { name: 'Next sentence' }).click() // The (S5)
    await page.getByRole('button', { name: 'Next sentence' }).click() // Bright
    await page.getByRole('button', { name: 'Next sentence' }).click() // Jackdaws
    await page.getByRole('button', { name: 'Next sentence' }).click() // Pack
    await page.getByRole('button', { name: 'Next sentence' }).click() // The (S9)
    await expect(reader.rsvpWord).toHaveText('The')

    await reader.play()
    await expect
      .poll(async () => reader.playButton.getAttribute('aria-label'), { timeout: 10_000 })
      .toBe('Play') // auto-paused at the final word
    await expect(reader.rsvpWord).toHaveText('again.')
    expect(await reader.progressPercent()).toBe(100)
  })

  test('should jump to a word clicked in the full-text pane', async () => {
    await reader.panelWord('jugs.').click()
    await expect(reader.rsvpWord).toHaveText('jugs.')
  })

  test('should pause and show the resume overlay when the reader scrolls away', async ({ page }) => {
    test.setTimeout(40_000)

    // Jump to the last paragraph (auto-scroll centers it), let the app's
    // 400ms auto-scroll guard clear, then scroll the pane far away.
    await reader.panelWord('Jackdaws').click()
    await expect(reader.rsvpWord).toHaveText('Jackdaws')
    await page.waitForTimeout(600) // outlive the isAutoScrolling guard

    await reader.textPanel.hover()
    await page.mouse.wheel(0, -1500)

    await expect(reader.resumeOverlay).toBeVisible()
    await expect(page.getByText('Tap to resume')).toBeVisible()
    await expect(reader.playButton).toHaveAccessibleName('Resume')

    // Tapping the overlay clears the flag AND resumes playback.
    await reader.resumeOverlay.click()
    await expect(reader.resumeOverlay).toHaveCount(0)
    await expect(reader.playButton).toHaveAccessibleName('Pause')

    // ...and pause again to leave a quiet page.
    await reader.pause()
  })

  test('should auto-fade the controls while playing and wake them on mouse move', async ({ page }) => {
    // Start with the keyboard so no mouse movement resets the fade timer.
    await page.keyboard.press('Space')
    await expect(reader.playButton).toHaveAccessibleName('Pause')

    // The pill fades out ~3s into uninterrupted playback.
    await expect
      .poll(
        async () => reader.controlsFadeWrapper.evaluate((el) => el.className),
        { timeout: 8_000 }
      )
      .toContain('opacity-0')

    // Any mouse movement wakes the controls back up.
    await page.mouse.move(200, 200)
    await expect
      .poll(
        async () => reader.controlsFadeWrapper.evaluate((el) => el.className),
        { timeout: 4_000 }
      )
      .toContain('opacity-100')
  })
})
