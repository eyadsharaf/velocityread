import { test, expect } from '@playwright/test'
import { LibraryPage } from '../pages/LibraryPage'
import { ReaderPage } from '../pages/ReaderPage'

test.describe('Feature: Library Management', () => {
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

  test('should list the imported book with its type and progress', async ({ page }) => {
    await reader.backToLibrary.click()

    await library.expectLibraryCount(1)
    const card = library.card('sample.txt')
    await expect(card).toBeVisible()
    await expect(card.getByText('TXT', { exact: true })).toBeVisible()
    await expect(card.getByText('sample', { exact: true })).toBeVisible()
    await expect(card.getByText(/% read/)).toBeVisible()
    await page.screenshot({ path: 'artifacts/library-card.png' })
  })

  test('should reopen a book from the library at the saved position', async ({ page }) => {
    // Advance to word 18 of 69 ("How") → 26% read.
    await page.getByRole('button', { name: 'Next sentence' }).click()
    await page.getByRole('button', { name: 'Next sentence' }).click()
    await expect(reader.rsvpWord).toHaveText('How')

    // Let the app's 500ms debounced progress write land before leaving.
    await page.waitForTimeout(800)

    await reader.backToLibrary.click()
    await expect(library.card('sample.txt').getByText('26% read')).toBeVisible()

    await library.openBook('sample.txt')
    await reader.expectOpen('How')
  })

  test('should require two clicks to delete a book, then return to the empty state', async ({ page }) => {
    await reader.backToLibrary.click()
    await library.expectLibraryCount(1)

    const card = library.card('sample.txt')

    // First click arms: "×" becomes "delete?" without removing anything.
    await card.getByRole('button', { name: 'Delete book' }).click()
    await expect(card.getByText('delete?')).toBeVisible()
    await expect(card).toBeVisible()

    // Second click confirms the delete.
    await library.deleteBook('sample.txt') // clicks × then "delete?"
    await library.expectEmptyState()
  })

  test('should auto-disarm the delete confirmation after 3 seconds', async ({ page }) => {
    test.setTimeout(40_000)
    await reader.backToLibrary.click()

    const card = library.card('sample.txt')
    await card.getByRole('button', { name: 'Delete book' }).click()
    await expect(card.getByText('delete?')).toBeVisible()

    // The armed state self-cancels after 3s — poll for the revert.
    await expect
      .poll(
        async () =>
          card.getByRole('button', { name: 'Delete book' }).isVisible(),
        { timeout: 8_000 }
      )
      .toBe(true)
    await expect(card).toBeVisible() // book was never deleted
  })

  test('should import an additional book from the library screen', async () => {
    await reader.backToLibrary.click()
    await library.expectLibraryCount(1)

    await library.importButton.click()
    await library.importFile('journey.md')
    await reader.expectOpen('Markdown')

    await reader.backToLibrary.click()
    await library.expectLibraryCount(2)
    await expect(library.card('journey.md')).toBeVisible()
    await expect(library.card('sample.txt')).toBeVisible()
  })

  test('should sort the library by most recently read', async ({ page }) => {
    await reader.backToLibrary.click()

    // Import a second book — it is the newest, so it sorts first.
    await library.importButton.click()
    await library.importFile('journey.md')
    await reader.expectOpen('Markdown')
    await reader.backToLibrary.click()

    const first = library.page.locator('article').first()
    await expect(first).toContainText('journey')
    await expect(first).toContainText('MD')

    // Re-opening the txt book refreshes its lastReadAt → it moves to the top.
    await library.openBook('sample.txt')
    await reader.expectOpen('The')
    await reader.backToLibrary.click()

    await expect(library.page.locator('article').first()).toContainText('TXT')
  })
})

test.describe('Feature: Built-in Sample', () => {
  let library: LibraryPage
  let reader: ReaderPage

  test.beforeEach(async ({ page }) => {
    library = new LibraryPage(page)
    reader = new ReaderPage(page)
    await library.goto()
    await library.expectEmptyState()
  })

  test('should open the built-in sample from the empty state', async () => {
    await library.page.getByRole('button', { name: 'read the sample' }).click()

    // First word of the essay, parsed and playing through the reader.
    await reader.expectOpen('You')
    await expect(reader.textPanel).toBeVisible()

    // It is a real library book: MD badge, listed, and reopenable.
    await reader.backToLibrary.click()
    await library.expectLibraryCount(1)
    await expect(
      library.card('On Reading Faster.md').getByText('MD', { exact: true })
    ).toBeVisible()
    await library.openBook('On Reading Faster.md')
    await reader.expectOpen('You')
  })
})
