import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page object for the reading surface: RSVP pane (word + ORP), transport
 * pill (play/pause, sentence skips, WPM, settings), text panel and
 * progress bar.
 */
export class ReaderPage {
  readonly page: Page
  /** The full flashed word (parent span of the highlighted ORP character). */
  readonly rsvpWord: Locator
  readonly orpChar: Locator
  readonly playButton: Locator
  readonly prevSentence: Locator
  readonly nextSentence: Locator
  readonly fasterButton: Locator
  readonly slowerButton: Locator
  readonly settingsButton: Locator
  readonly settingsDialog: Locator
  readonly backToLibrary: Locator
  readonly textPanel: Locator
  readonly progressBar: Locator
  readonly resumeOverlay: Locator
  readonly controlsFadeWrapper: Locator

  constructor(page: Page) {
    this.page = page
    this.rsvpWord = page.locator('span.font-sans:has(> .orp-char)')
    this.orpChar = page.locator('.orp-char')
    // The pill's play/pause button only (the "Tap to resume" overlay is a
    // div[role=button] with the same aria-label — excluded by tag name).
    this.playButton = page.locator(
      'button[aria-label="Play"], button[aria-label="Pause"], button[aria-label="Resume"]'
    )
    this.prevSentence = page.getByRole('button', { name: 'Previous sentence' })
    this.nextSentence = page.getByRole('button', { name: 'Next sentence' })
    this.fasterButton = page.getByRole('button', { name: 'Faster' })
    this.slowerButton = page.getByRole('button', { name: 'Slower' })
    this.settingsButton = page.getByRole('button', { name: 'Settings' })
    this.settingsDialog = page.getByRole('dialog', { name: 'Settings' })
    this.backToLibrary = page.getByRole('button', { name: 'Back to library' })
    this.textPanel = page.locator('.text-panel')
    this.progressBar = page.locator('.h-full.bg-accent')
    // The full-pane "Tap to resume" overlay (a div[role=button], not the pill).
    this.resumeOverlay = page.locator('div[role="button"][aria-label="Resume"]')
    // Wrapper whose class flips opacity-0/opacity-100 when controls fade.
    this.controlsFadeWrapper = page.locator('div.z-20.controls-fade.inset-0')
  }

  /** Wait until the reader is open and showing a specific word. */
  async expectOpen(firstWord: string) {
    await expect(this.rsvpWord).toHaveText(firstWord)
    await expect(this.playButton).toBeVisible()
  }

  async currentWord(): Promise<string> {
    return ((await this.rsvpWord.textContent()) ?? '').trim()
  }

  /** Current WPM as an integer (the display hides the " WPM" suffix < 430px). */
  async wpm(): Promise<number> {
    const text = await this.page.locator('.wpm-pulse').textContent()
    return parseInt((text ?? '').replace(/[^\d]/g, ''), 10)
  }

  async progressPercent(): Promise<number> {
    return this.progressBar.evaluate((el) => parseFloat(el.style.width))
  }

  /** A clickable word in the full-text pane. */
  panelWord(word: string): Locator {
    return this.textPanel
      .locator('span.cursor-pointer')
      .filter({ hasText: new RegExp(`^${escapeRegExp(word)}$`) })
      .first()
  }

  async play() {
    await this.page.locator('button[aria-label="Play"]').click()
  }

  async pause() {
    await this.page.locator('button[aria-label="Pause"]').click()
  }

  async openSettings() {
    await this.settingsButton.click()
    await expect(this.settingsDialog).toBeVisible()
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
