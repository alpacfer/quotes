/********************************************************
 * IndexedDB Setup
 ********************************************************/
let db = null;
const DB_NAME = "QuotesDatabase";
const DB_VERSION = 1;
const STORE_NAME = "quotes";

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB not accessible.");
      reject("Error opening DB");
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

// Get Transaction
function getTransaction(mode) {
  if (!db) throw new Error("DB not opened.");
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

// Add Quote to DB
function addQuoteToDB(quote) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.add(quote);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to add quote.");
  });
}

// Update Quote in DB
function updateQuoteInDB(quote) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.put(quote);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to update quote.");
  });
}

// Delete Quote from DB
function deleteQuoteFromDB(id) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to delete quote.");
  });
}

// Get All Quotes from DB
function getAllQuotesFromDB() {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readonly");
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject("Unable to fetch quotes.");
  });
}

/********************************************************
 * Global Variables
 ********************************************************/
let quotes = [];
let editingQuoteId = null;
let quoteToDeleteId = null;
let currentViewQuoteId = null;

/********************************************************
 * DOM Elements
 ********************************************************/
// Side Panel
const sidePanel = document.getElementById("sidePanel");
const openSidebarBtn = document.getElementById("openSidebarBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");

const homeSideBtn = document.getElementById("homeSideBtn");
const top5BooksList = document.getElementById("top5BooksList");
const showAllBooksBtn = document.getElementById("showAllBooks");
const top5AuthorsList = document.getElementById("top5AuthorsList");
const showAllAuthorsBtn = document.getElementById("showAllAuthors");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

// Main: Quotes Page
const quotesPage = document.getElementById("quotesPage");
const quotesSearchInput = document.getElementById("quotesSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const addQuoteToggle = document.getElementById("addQuoteToggle");
const defaultQuotesGrid = document.getElementById("defaultQuotesGrid");

// Search Results
const searchResultsGrid = document.getElementById("searchResultsGrid");
const searchQuotesSection = document.getElementById("searchQuotesSection");
const searchBooksSection = document.getElementById("searchBooksSection");
const searchAuthorsSection = document.getElementById("searchAuthorsSection");
const searchQuotesGrid = document.getElementById("searchQuotesGrid");
const searchBooksGrid = document.getElementById("searchBooksGrid");
const searchAuthorsGrid = document.getElementById("searchAuthorsGrid");

// Authors Page
const authorsPage = document.getElementById("authorsPage");
const backFromAuthors = document.getElementById("backFromAuthors");
const authorsList = document.getElementById("authorsList");

// Books Page
const booksPage = document.getElementById("booksPage");
const backFromBooks = document.getElementById("backFromBooks");
const booksList = document.getElementById("booksList");

// Author Detail Page
const authorDetailPage = document.getElementById("authorDetailPage");
const backFromAuthorDetail = document.getElementById("backFromAuthorDetail");
const authorNameDetail = document.getElementById("authorNameDetail");
const authorBooksList = document.getElementById("authorBooksList");
const authorQuotesGrid = document.getElementById("authorQuotesGrid");

// Book Detail Page
const bookDetailPage = document.getElementById("bookDetailPage");
const backFromBookDetail = document.getElementById("backFromBookDetail");
const bookTitleDetail = document.getElementById("bookTitleDetail");
const bookAuthorDetail = document.getElementById("bookAuthorDetail");
const bookQuotesGrid = document.getElementById("bookQuotesGrid");

// Modals
const modalOverlay = document.getElementById("modalOverlay");
const addQuoteMenu = document.getElementById("addQuoteMenu");
const quoteForm = document.getElementById("quoteForm");
const quoteTextInput = document.getElementById("quoteText");
const bookTitleInput = document.getElementById("bookTitle");
const authorNameInput = document.getElementById("authorName");
const discardBtn = document.getElementById("discardBtn");
const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const viewQuoteModal = document.getElementById("viewQuoteModal");
const viewQuoteText = document.getElementById("viewQuoteText");
const viewQuoteBook = document.getElementById("viewQuoteBook");
const viewQuoteAuthor = document.getElementById("viewQuoteAuthor");
const viewEditBtn = document.getElementById("viewEditBtn");
const viewDeleteBtn = document.getElementById("viewDeleteBtn");

// DataLists for autocomplete
const booksDataList = document.getElementById("booksDataList");
const authorsDataList = document.getElementById("authorsDataList");

/********************************************************
 * Event Listeners
 ********************************************************/
// Side Panel Navigation
closeSidebarBtn.addEventListener("click", () => {
  sidePanel.classList.add("collapsed");
  openSidebarBtn.classList.remove("hidden");
});
openSidebarBtn.addEventListener("click", () => {
  sidePanel.classList.remove("collapsed");
  openSidebarBtn.classList.add("hidden");
});

homeSideBtn.addEventListener("click", () => {
  showQuotesPage();
  clearSearchField();
});
showAllBooksBtn.addEventListener("click", showBooksPage);
showAllAuthorsBtn.addEventListener("click", showAuthorsPage);

// Quotes Page
quotesSearchInput.addEventListener("input", debounce(handleSearchInput, 300));
addQuoteToggle.addEventListener("click", () => {
  editingQuoteId = null;
  openAddQuoteModal();
});
clearSearchBtn.addEventListener("click", clearSearchField);

// Authors & Books Nav
backFromAuthors.addEventListener("click", showQuotesPage);
backFromBooks.addEventListener("click", showQuotesPage);

// Author Detail
backFromAuthorDetail.addEventListener("click", showAuthorsPage);

// Book Detail
backFromBookDetail.addEventListener("click", showBooksPage);

// Add/Edit Quote Modal
discardBtn.addEventListener("click", () => {
  resetForm();
  closeAddQuoteModal();
});
quoteForm.addEventListener("submit", handleFormSubmit);

// Confirm Deletion
deleteConfirmBtn.addEventListener("click", confirmDeletion);
deleteCancelBtn.addEventListener("click", cancelDeletion);

// View Quote Modal
viewEditBtn.addEventListener("click", () => {
  const quote = quotes.find((q) => q.id === currentViewQuoteId);
  if (quote) {
    editingQuoteId = quote.id;
    quoteTextInput.value = quote.quoteText;
    bookTitleInput.value = quote.bookTitle;
    authorNameInput.value = quote.authorName;
    closeViewQuoteModal();
    openAddQuoteModal();
  }
});
viewDeleteBtn.addEventListener("click", () => {
  quoteToDeleteId = currentViewQuoteId;
  openConfirmDeleteModal();
  closeViewQuoteModal();
});

// Export / Import
exportBtn.addEventListener("click", exportQuotes);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", importQuotes);

// Clicking outside => close only for certain modals
window.addEventListener("click", (event) => {
  // Overlay clicked?
  if (event.target === modalOverlay) {
    // For viewQuoteModal
    if (!viewQuoteModal.classList.contains("hidden")) {
      closeViewQuoteModal();
    }
    // For confirmDeleteModal
    if (!confirmDeleteModal.classList.contains("hidden")) {
      cancelDeletion();
    }
    // DO NOT close addQuoteMenu when clicked outside
    // (per your requirement, add/edit modal does NOT dismiss)
  }
});

/********************************************************
 * On Page Load
 ********************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await openDB();
    await loadQuotesFromDB();
    showQuotesPage();
  } catch (error) {
    console.error(error);
    alert("Failed to initialize the application.");
  }
});

/********************************************************
 * Page Navigation Functions
 ********************************************************/
function showQuotesPage() {
  quotesPage.classList.remove("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  hideOverlay();

  handleSearchInput();
}

function showAuthorsPage() {
  quotesPage.classList.add("hidden");
  authorsPage.classList.remove("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  hideOverlay();
  renderAuthors();
}

function showBooksPage() {
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.remove("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  hideOverlay();
  renderBooks();
}

/********************************************************
 * Modal Handling Functions
 ********************************************************/
function showOverlay() {
  modalOverlay.classList.remove("hidden");
}

function hideOverlay() {
  modalOverlay.classList.add("hidden");
}

function openAddQuoteModal() {
  addQuoteMenu.classList.remove("hidden");
  showOverlay();
}

function closeAddQuoteModal() {
  addQuoteMenu.classList.add("hidden");
  hideOverlay();
}

function openViewQuoteModal(id) {
  const quote = quotes.find((q) => q.id === id);
  if (!quote) {
    alert("Quote not found.");
    return;
  }
  currentViewQuoteId = id;

  viewQuoteText.textContent = quote.quoteText;
  viewQuoteBook.innerHTML = `<a href="#" id="viewBookLink">${quote.bookTitle}</a>`;
  viewQuoteAuthor.innerHTML = `<a href="#" id="viewAuthorLink">${quote.authorName}</a>`;

  viewQuoteModal.classList.remove("hidden");
  showOverlay();

  const viewBookLink = document.getElementById("viewBookLink");
  const viewAuthorLink = document.getElementById("viewAuthorLink");
  const newViewBookLink = viewBookLink.cloneNode(true);
  const newViewAuthorLink = viewAuthorLink.cloneNode(true);

  viewQuoteBook.replaceChild(newViewBookLink, viewBookLink);
  viewQuoteAuthor.replaceChild(newViewAuthorLink, viewAuthorLink);

  newViewBookLink.addEventListener("click", (e) => {
    e.preventDefault();
    closeViewQuoteModal();
    openBookDetailPage(quote.bookTitle);
  });

  newViewAuthorLink.addEventListener("click", (e) => {
    e.preventDefault();
    closeViewQuoteModal();
    openAuthorDetailPage(quote.authorName);
  });
}

function closeViewQuoteModal() {
  viewQuoteModal.classList.add("hidden");
  hideOverlay();
}

function openConfirmDeleteModal() {
  confirmDeleteModal.classList.remove("hidden");
  showOverlay();
}

function closeConfirmDeleteModal() {
  confirmDeleteModal.classList.add("hidden");
  hideOverlay();
}

/********************************************************
 * Confirm Deletion
 ********************************************************/
function confirmDeletion() {
  closeConfirmDeleteModal();
  if (quoteToDeleteId) {
    quotes = quotes.filter((q) => q.id !== quoteToDeleteId);
    deleteQuoteFromDB(quoteToDeleteId)
      .then(() => {
        handleSearchInput();
        renderAuthors();
        renderBooks();
        updateSidePanel();
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to delete the quote.");
      });
    quoteToDeleteId = null;
  }
}

function cancelDeletion() {
  quoteToDeleteId = null;
  closeConfirmDeleteModal();
}

/********************************************************
 * Form Handling (Add/Edit Quote)
 ********************************************************/
function handleFormSubmit(e) {
  e.preventDefault();
  saveQuote();
}

async function saveQuote() {
  const quoteText = quoteTextInput.value.trim();
  const bookTitle = bookTitleInput.value.trim();
  const authorName = authorNameInput.value.trim();

  if (!quoteText || !bookTitle || !authorName) {
    alert("Please fill in all required fields.");
    return;
  }

  if (editingQuoteId) {
    const index = quotes.findIndex((q) => q.id === editingQuoteId);
    if (index !== -1) {
      quotes[index].quoteText = quoteText;
      quotes[index].bookTitle = bookTitle;
      quotes[index].authorName = authorName;
      try {
        await updateQuoteInDB(quotes[index]);
      } catch (error) {
        console.error(error);
        alert("Failed to update the quote.");
        return;
      }
    }
    editingQuoteId = null;
  } else {
    const newQuote = {
      id: crypto.randomUUID(),
      quoteText,
      bookTitle,
      authorName,
    };
    quotes.push(newQuote);
    try {
      await addQuoteToDB(newQuote);
    } catch (error) {
      console.error(error);
      alert("Failed to add the quote.");
      return;
    }
  }

  resetForm();
  closeAddQuoteModal();
  // After changes, re-render
  handleSearchInput();
  renderAuthors();
  renderBooks();
  updateSidePanel();
  updateDataLists(); // Refresh datalist
}

function resetForm() {
  quoteForm.reset();
  editingQuoteId = null;
}

/********************************************************
 * Load & Render Quotes
 ********************************************************/
async function loadQuotesFromDB() {
  try {
    quotes = await getAllQuotesFromDB();
    updateSidePanel();
    renderAuthors();
    renderBooks();
    updateDataLists();
  } catch (error) {
    console.error(error);
    alert("Failed to load quotes from the database.");
  }
}

/********************************************************
 * Autocomplete DataLists
 ********************************************************/
function updateDataLists() {
  // Unique Books
  const uniqueBooks = [...new Set(quotes.map(q => q.bookTitle.trim()))];
  booksDataList.innerHTML = uniqueBooks
    .map(book => `<option value="${book}">`)
    .join("");

  // Unique Authors
  const uniqueAuthors = [...new Set(quotes.map(q => q.authorName.trim()))];
  authorsDataList.innerHTML = uniqueAuthors
    .map(author => `<option value="${author}">`)
    .join("");
}

/********************************************************
 * Search Integration (Quotes Page)
 ********************************************************/
function handleSearchInput() {
  const query = quotesSearchInput.value.trim().toLowerCase();

  searchQuotesGrid.innerHTML = "";
  searchBooksGrid.innerHTML = "";
  searchAuthorsGrid.innerHTML = "";

  if (query) {
    searchResultsGrid.classList.remove("hidden");
    defaultQuotesGrid.parentElement.classList.add("hidden");
  } else {
    searchResultsGrid.classList.add("hidden");
    defaultQuotesGrid.parentElement.classList.remove("hidden");
  }

  if (!query) {
    if (quotes.length === 0) {
      defaultQuotesGrid.innerHTML = "<p>No quotes added yet.</p>";
      return;
    }
    defaultQuotesGrid.innerHTML = "";
    quotes.forEach((quote) => {
      const card = createCard(quote, "quote");
      defaultQuotesGrid.appendChild(card);
    });
    return;
  }

  const matchedQuotes = quotes.filter((q) =>
    q.quoteText.toLowerCase().includes(query)
  );
  const matchedAuthors = Array.from(
    new Set(
      quotes
        .filter((q) => q.authorName.toLowerCase().includes(query))
        .map((q) => q.authorName.trim())
    )
  );
  const matchedBooks = Array.from(
    new Set(
      quotes
        .filter((q) => q.bookTitle.toLowerCase().includes(query))
        .map((q) => q.bookTitle.trim())
    )
  );

  // Render quotes
  if (matchedQuotes.length > 0) {
    searchQuotesSection.classList.remove("hidden");
    matchedQuotes.forEach((quote) => {
      const card = createCard(quote, "quote");
      searchQuotesGrid.appendChild(card);
    });
  } else {
    searchQuotesSection.classList.add("hidden");
  }

  // Render authors
  if (matchedAuthors.length > 0) {
    searchAuthorsSection.classList.remove("hidden");
    matchedAuthors.forEach((authorName) => {
      const authorQuotes = quotes.filter((q) => q.authorName === authorName);
      const authorObj = {
        name: authorName,
        quoteCount: authorQuotes.length,
        books: new Set(authorQuotes.map((q) => q.bookTitle)),
      };
      const card = createCard(authorObj, "author");
      searchAuthorsGrid.appendChild(card);
    });
  } else {
    searchAuthorsSection.classList.add("hidden");
  }

  // Render books
  if (matchedBooks.length > 0) {
    searchBooksSection.classList.remove("hidden");
    matchedBooks.forEach((bookTitle) => {
      const bookQuotes = quotes.filter((q) => q.bookTitle === bookTitle);
      const bookObj = {
        title: bookTitle,
        author: bookQuotes[0]?.authorName || "Unknown",
        quoteCount: bookQuotes.length,
      };
      const card = createCard(bookObj, "book");
      searchBooksGrid.appendChild(card);
    });
  } else {
    searchBooksSection.classList.add("hidden");
  }
}

/********************************************************
 * Debounce
 ********************************************************/
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

/********************************************************
 * Clear Search
 ********************************************************/
function clearSearchField() {
  quotesSearchInput.value = "";
  handleSearchInput();
}

/********************************************************
 * Authors
 ********************************************************/
function renderAuthors() {
  authorsList.innerHTML = "";

  if (quotes.length === 0) {
    authorsList.innerHTML = "<p>No authors to display.</p>";
    return;
  }

  const map = {};
  quotes.forEach((q) => {
    const key = q.authorName.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        name: q.authorName.trim(),
        quoteCount: 0,
        books: new Set(),
      };
    }
    map[key].quoteCount++;
    map[key].books.add(q.bookTitle.trim());
  });

  const sortedAuthors = Object.values(map).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  sortedAuthors.forEach((authorObj) => {
    const card = createCard(authorObj, "author");
    authorsList.appendChild(card);
  });
}

/********************************************************
 * Books
 ********************************************************/
function renderBooks() {
  booksList.innerHTML = "";

  if (quotes.length === 0) {
    booksList.innerHTML = "<p>No books to display.</p>";
    return;
  }

  const map = {};
  quotes.forEach((q) => {
    const key = q.bookTitle.trim().toLowerCase();
    if (!map[key]) {
      map[key] = {
        title: q.bookTitle.trim(),
        author: q.authorName.trim(),
        quoteCount: 0,
      };
    }
    map[key].quoteCount++;
  });

  const sortedBooks = Object.values(map).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  sortedBooks.forEach((bookObj) => {
    const card = createCard(bookObj, "book");
    booksList.appendChild(card);
  });
}

/********************************************************
 * Author Detail
 ********************************************************/
function openAuthorDetailPage(authorName) {
  authorsPage.classList.add("hidden");
  quotesPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.remove("hidden");
  bookDetailPage.classList.add("hidden");

  hideOverlay();

  const authorQuotes = quotes.filter(
    (q) => q.authorName.toLowerCase() === authorName.toLowerCase()
  );
  authorNameDetail.textContent = authorName;

  const booksSet = new Set(authorQuotes.map((q) => q.bookTitle));
  if (booksSet.size > 0) {
    authorBooksList.innerHTML = "";
    booksSet.forEach((bookTitle) => {
      const bookQuotes = quotes.filter((q) => q.bookTitle === bookTitle);
      const bookObj = {
        title: bookTitle,
        author: authorName,
        quoteCount: bookQuotes.length,
      };
      const card = createCard(bookObj, "book");
      authorBooksList.appendChild(card);
    });
  } else {
    authorBooksList.innerHTML = "<p>No books available for this author.</p>";
  }

  if (authorQuotes.length > 0) {
    authorQuotesGrid.innerHTML = "";
    authorQuotes.forEach((quote) => {
      const card = createCard(quote, "quote");
      authorQuotesGrid.appendChild(card);
    });
  } else {
    authorQuotesGrid.innerHTML = "<p>No quotes available for this author.</p>";
  }
}

/********************************************************
 * Book Detail
 ********************************************************/
function openBookDetailPage(bookTitle) {
  authorsPage.classList.add("hidden");
  quotesPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.remove("hidden");

  hideOverlay();

  const bookQuotes = quotes.filter(
    (q) => q.bookTitle.toLowerCase() === bookTitle.toLowerCase()
  );
  if (bookQuotes.length === 0) {
    bookTitleDetail.textContent = bookTitle;
    bookAuthorDetail.textContent = "By Unknown";
    bookQuotesGrid.innerHTML = "<p>No quotes available for this book.</p>";
    return;
  }

  const book = bookQuotes[0];
  bookTitleDetail.textContent = book.bookTitle;
  bookAuthorDetail.textContent = `By ${book.authorName}`;

  if (bookQuotes.length > 0) {
    bookQuotesGrid.innerHTML = "";
    bookQuotes.forEach((quote) => {
      const card = createCard(quote, "quote");
      bookQuotesGrid.appendChild(card);
    });
  } else {
    bookQuotesGrid.innerHTML = "<p>No quotes available for this book.</p>";
  }
}

/********************************************************
 * Export & Import
 ********************************************************/
function exportQuotes() {
  if (quotes.length === 0) {
    alert("No quotes to export.");
    return;
  }

  const headers = ["Quote", "Book Title", "Author Name"];
  const rows = quotes.map(
    (q) =>
      `"${q.quoteText.replace(/"/g, '""')}", "${q.bookTitle.replace(/"/g, '""')}", "${q.authorName.replace(/"/g, '""')}"`
  );
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "quotes_export.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function importQuotes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const content = e.target.result;
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      alert("CSV file does not contain data.");
      return;
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
    const quoteIndex = headers.indexOf("quote");
    const bookTitleIndex = headers.indexOf("book title");
    const authorNameIndex = headers.indexOf("author name");

    if (quoteIndex === -1 || bookTitleIndex === -1 || authorNameIndex === -1) {
      alert("Invalid CSV format. Expected: Quote, Book Title, Author Name.");
      return;
    }

    const newQuotes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      const quoteText = values[quoteIndex]
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"')
        .trim();
      const bookTitle = values[bookTitleIndex]
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"')
        .trim();
      const authorName = values[authorNameIndex]
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"')
        .trim();

      if (quoteText && bookTitle && authorName) {
        const duplicate = quotes.find(
          (q) =>
            q.quoteText === quoteText &&
            q.bookTitle === bookTitle &&
            q.authorName === authorName
        );
        if (!duplicate) {
          const newQuote = {
            id: crypto.randomUUID(),
            quoteText,
            bookTitle,
            authorName,
          };
          newQuotes.push(newQuote);
        }
      }
    }

    if (newQuotes.length === 0) {
      alert("No new quotes or all duplicates.");
      return;
    }

    for (const quote of newQuotes) {
      try {
        await addQuoteToDB(quote);
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to add quote: ${error}`);
      }
    }

    handleSearchInput();
    renderAuthors();
    renderBooks();
    updateSidePanel();
    updateDataLists();
    alert(`${newQuotes.length} quote(s) imported successfully.`);
  };

  reader.onerror = () => {
    alert("Failed to read the file.");
  };

  reader.readAsText(file);
}

/********************************************************
 * Parse CSV Line
 ********************************************************/
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/********************************************************
 * Side Panel Update
 ********************************************************/
function updateSidePanel() {
  // Top 5 Books
  top5BooksList.innerHTML = "";
  if (quotes.length > 0) {
    const bookCountMap = {};
    quotes.forEach((q) => {
      const key = q.bookTitle.trim().toLowerCase();
      if (!bookCountMap[key]) {
        bookCountMap[key] = {
          title: q.bookTitle.trim(),
          count: 0,
        };
      }
      bookCountMap[key].count++;
    });
    const sortedBooks = Object.values(bookCountMap).sort(
      (a, b) => b.count - a.count
    );
    const top5 = sortedBooks.slice(0, 5);

    top5.forEach((bookObj) => {
      const li = document.createElement("li");
      li.textContent = `${bookObj.title} (${bookObj.count})`;
      li.classList.add("side-list-item");
      li.addEventListener("click", () => {
        openBookDetailPage(bookObj.title);
      });
      top5BooksList.appendChild(li);
    });
  }

  // Top 5 Authors
  top5AuthorsList.innerHTML = "";
  if (quotes.length > 0) {
    const authorCountMap = {};
    quotes.forEach((q) => {
      const key = q.authorName.trim().toLowerCase();
      if (!authorCountMap[key]) {
        authorCountMap[key] = {
          name: q.authorName.trim(),
          count: 0,
        };
      }
      authorCountMap[key].count++;
    });
    const sortedAuthors = Object.values(authorCountMap).sort(
      (a, b) => b.count - a.count
    );
    const top5Authors = sortedAuthors.slice(0, 5);

    top5Authors.forEach((authorObj) => {
      const li = document.createElement("li");
      li.textContent = `${authorObj.name} (${authorObj.count})`;
      li.classList.add("side-list-item");
      li.addEventListener("click", () => {
        openAuthorDetailPage(authorObj.name);
      });
      top5AuthorsList.appendChild(li);
    });
  }
}

/********************************************************
 * Utility Functions
 ********************************************************/
function createCard(item, type) {
  const card = document.createElement("div");
  card.classList.add("card");

  // 3D hover tilt
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const cardWidth = rect.width;
    const cardHeight = rect.height;
    const centerX = rect.left + cardWidth / 2;
    const centerY = rect.top + cardHeight / 2;

    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;

    const rotateMax = 1; // degrees
    const rotateX = (offsetY / (cardHeight / 2)) * rotateMax;
    const rotateY = -(offsetX / (cardWidth / 2)) * rotateMax;

    card.style.transform = `translateZ(3px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateZ(0) rotateX(0) rotateY(0)";
  });

  if (type === "quote") {
    card.classList.add("quote-card");
    card.innerHTML = `
      <p class="quote-text">${item.quoteText}</p>
      <div class="card-footer">
        <div class="quote-details">
          <a href="#" class="quote-book">${item.bookTitle}</a>
          <a href="#" class="quote-author">${item.authorName}</a>
        </div>
        <div class="actions">
          <button class="edit-btn" data-id="${item.id}" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button class="delete-btn" data-id="${item.id}" title="Delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      openViewQuoteModal(item.id);
    });

    const editBtn = card.querySelector(".edit-btn");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editQuote(e);
    });

    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeQuote(e);
    });

    const bookEl = card.querySelector(".quote-book");
    bookEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookDetailPage(item.bookTitle);
    });

    const authorEl = card.querySelector(".quote-author");
    authorEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAuthorDetailPage(item.authorName);
    });
  } else if (type === "author") {
    card.classList.add("author-card");
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.quoteCount} ${item.quoteCount === 1 ? "quote" : "quotes"}</p>
      <p>${item.books.size} ${item.books.size === 1 ? "book" : "books"}</p>
    `;
    card.addEventListener("click", () => {
      openAuthorDetailPage(item.name);
    });
  } else if (type === "book") {
    card.classList.add("book-card");
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>By ${item.author}</p>
      <p>${item.quoteCount} ${item.quoteCount === 1 ? "quote" : "quotes"}</p>
    `;
    card.addEventListener("click", () => {
      openBookDetailPage(item.title);
    });
  }

  return card;
}

function editQuote(e) {
  const quoteId = e.target.closest("button").getAttribute("data-id");
  const quoteToEdit = quotes.find((q) => q.id === quoteId);
  if (!quoteToEdit) {
    alert("Quote not found.");
    return;
  }
  editingQuoteId = quoteId;
  quoteTextInput.value = quoteToEdit.quoteText;
  bookTitleInput.value = quoteToEdit.bookTitle;
  authorNameInput.value = quoteToEdit.authorName;
  openAddQuoteModal();
}

function removeQuote(e) {
  const quoteId = e.target.closest("button").getAttribute("data-id");
  quoteToDeleteId = quoteId;
  openConfirmDeleteModal();
}
