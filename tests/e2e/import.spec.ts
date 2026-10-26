import { test, expect } from '@playwright/test'
import { LibraryPage, fixture } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: File Import', () => {
  let library: LibraryPage
  let reader: ReaderPage

  test.beforeEach(async ({ page }) => {
    library = new LibraryPage(page)
    reader = new ReaderPage(page)
    await library.goto()
    await library.expectEmptyState()
  })

  test('should show the empty-state drop zone on first run', async ({ page }) => {
    await expect(library.heading).toBeVisible()
    await expect(page.getByText('Speed-read anything')).toBeVisible()
    await expect(page.getByText('Drop a file here')).toBeVisible()
    await expect(page.getByText('or click to browse')).toBeVisible()
    await expect(page.getByText('EPUB · PDF · TXT · MD')).toBeVisible()
  })

  test('should import a .txt file and open the reader on the first word', async () => {
    await library.importFile('sample.txt')

    await reader.expectOpen('The')
    await expect(reader.textPanel).toBeVisible()
    await expect(reader.backToLibrary).toBeVisible()
  })

  test('should import a .md file and open the reader with markdown stripped', async () => {
    await library.importFile('journey.md')

    // "# Markdown Journey" → first word "Markdown" (markup removed, words kept)
    await reader.expectOpen('Markdown')
    await expect(reader.textPanel).toBeVisible()
  })

  test('should import an .epub file and open the reader', async () => {
    await library.importFile('sample.epub')

    // epubjs surfaces the chapter <title> first, then the body paragraphs.
    await reader.expectOpen('Chapter')
    await expect(reader.textPanel).toBeVisible()
  })

  test('should import a .pdf file and open the reader', async () => {
    await library.importFile('sample.pdf')

    await reader.expectOpen('The')
    await expect(reader.textPanel).toBeVisible()
  })

  test('should import a file dropped onto the drop zone', async () => {
    await library.dropFile('sample.txt')

    await reader.expectOpen('The')
  })

  test('should highlight the drop zone while a file is dragged over it', async ({ page }) => {
    await page.evaluate(() => {
      const target = document.querySelector('[aria-label="Import a file"]')
      if (!target) throw new Error('Drop zone not found')
      const dt = new DataTransfer()
      const fire = (type: string) => {
        const ev = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperty(ev, 'dataTransfer', { value: dt })
        target.dispatchEvent(ev)
      }
      fire('dragenter')
      fire('dragover')
    })

    await expect(library.dropZone).toHaveClass(/border-accent/)

    await page.evaluate(() => {
      const target = document.querySelector('[aria-label="Import a file"]')
      const ev = new Event('dragleave', { bubbles: true, cancelable: true })
      target?.dispatchEvent(ev)
    })
    await expect(library.dropZone).not.toHaveClass(/border-accent/)
  })

  test('should show an error and stay on the drop zone for a file with no readable text', async ({ page }) => {
    await library.importFile('empty.txt')

    await expect(page.getByText('No readable text found in file')).toBeVisible()
    await library.expectEmptyState()
  })
})
