import { expect, type Locator, type Page } from '@playwright/test'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute path to a fixture in tests/fixtures. */
export const fixture = (name: string) =>
  resolve(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', name)

/**
 * Page object for the library surface: the empty-state drop zone
 * (EmptyState + DropZone) and the book list (LibraryScreen).
 */
export class LibraryPage {
  readonly page: Page
  readonly heading: Locator
  readonly dropZone: Locator
  readonly fileInput: Locator
  readonly importButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'VelocityRead' })
    this.dropZone = page.getByRole('button', { name: 'Import a file' })
    this.fileInput = page.locator('input[type="file"]')
    this.importButton = page.getByRole('button', { name: '＋ Import', exact: true })
  }

  /** Navigate to the app and wait for launch hydration to finish. */
  async goto() {
    await this.page.goto('/')
    // The app hydrates asynchronously from IndexedDB before first paint of
    // either screen — the VelocityRead heading exists on both outcomes.
    await expect(this.heading).toBeVisible()
  }

  async expectEmptyState() {
    await expect(this.dropZone).toBeVisible()
    await expect(this.page.getByText('Drop a file here')).toBeVisible()
  }

  async expectLibraryCount(n: number) {
    await expect(
      this.page.getByText(`Library · ${n} ${n === 1 ? 'book' : 'books'}`)
    ).toBeVisible()
  }

  /** Import a file through the (hidden) file input — works on both surfaces. */
  async importFile(name: string) {
    await this.fileInput.setInputFiles(fixture(name))
  }

  /** Import a file by dispatching a real `drop` event with a DataTransfer. */
  async dropFile(name: string, mimeType = 'text/plain') {
    const path = fixture(name)
    await this.page.evaluate(
      async ({ fileName, mimeType, b64 }) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        const file = new File([bytes], fileName, { type: mimeType })
        const dt = new DataTransfer()
        dt.items.add(file)
        const target = document.querySelector('[aria-label="Import a file"]')
        if (!target) throw new Error('Drop zone not found')
        // Synthetic drag events: some engines ignore `dataTransfer` in the
        // DragEvent init dict, so assign it onto a plain Event instead.
        const fire = (type: string) => {
          const ev = new Event(type, { bubbles: true, cancelable: true })
          Object.defineProperty(ev, 'dataTransfer', { value: dt })
          target.dispatchEvent(ev)
        }
        fire('dragenter')
        fire('dragover')
        fire('drop')
      },
      { fileName: path.split('/').pop()!, mimeType, b64: b64encode(path) }
    )
  }

  /** The library card for a stored file (matched by its title row). */
  card(fileName: string) {
    const title = fileName.replace(/\.[^.]+$/, '')
    return this.page.locator('article', { hasText: title })
  }

  async openBook(fileName: string) {
    await this.page.getByRole('button', { name: `Open ${fileName}` }).click()
  }

  async deleteBook(fileName: string) {
    const card = this.card(fileName)
    await card.getByRole('button', { name: 'Delete book' }).click()
    await card.getByRole('button', { name: 'Confirm delete' }).click()
  }
}

/** Read a file as base64 inside the Node side of the evaluate boundary. */
function b64encode(path: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('node:fs') as typeof import('node:fs')
  return fs.readFileSync(path).toString('base64')
}
