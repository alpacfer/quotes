/* IndexedDB Setup */
let db = null;
const DB_NAME = "QuotesDatabase";
const DB_VERSION = 1;
const STORE_NAME = "quotes";

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

function getTransaction(mode) {
  if (!db) throw new Error("DB not opened.");
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function addQuoteToDB(quote) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.add(quote);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to add quote.");
  });
}

function updateQuoteInDB(quote) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.put(quote);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to update quote.");
  });
}

function deleteQuoteFromDB(id) {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readwrite");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject("Unable to delete quote.");
  });
}

function getAllQuotesFromDB() {
  return new Promise((resolve, reject) => {
    const store = getTransaction("readonly");
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => reject("Unable to fetch quotes.");
  });
}

/*******************************************************************
 * Global Variables
 ******************************************************************/
let quotes = [];
let editingQuoteId = null;
let quoteToDeleteId = null;
let currentViewQuoteId = null;

/*******************************************************************
 * DOM Elements
 ******************************************************************/
const topNav = document.getElementById("topNav");
const homeBtn = document.getElementById("homeBtn");
const quotesNavBtn = document.getElementById("quotesNavBtn");
const authorsNavBtn = document.getElementById("authorsNavBtn");
const booksNavBtn = document.getElementById("booksNavBtn");

const mainMenu = document.getElementById("mainMenu");
const quotesPage = document.getElementById("quotesPage");
const authorsPage = document.getElementById("authorsPage");
const booksPage = document.getElementById("booksPage");
const authorDetailPage = document.getElementById("authorDetailPage");
const bookDetailPage = document.getElementById("bookDetailPage");
const searchPage = document.getElementById("searchPage");

const quotesMenuBtn = document.getElementById("quotesMenu");
const authorsMenuBtn = document.getElementById("authorsMenu");
const booksMenuBtn = document.getElementById("booksMenu");

const addQuoteToggle = document.getElementById("addQuoteToggle");
const addQuoteMenu = document.getElementById("addQuoteMenu");
const quoteForm = document.getElementById("quoteForm");
const quoteTextInput = document.getElementById("quoteText");
const bookTitleInput = document.getElementById("bookTitle");
const authorNameInput = document.getElementById("authorName");
const discardBtn = document.getElementById("discardBtn");

const quotesGrid = document.querySelector(".quotes-grid .grid");
const authorsList = document.getElementById("authorsList");
const booksList = document.getElementById("booksList");

const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");

const viewQuoteModal = document.getElementById("viewQuoteModal");
const viewQuoteText = document.getElementById("viewQuoteText");
const viewQuoteBook = document.getElementById("viewQuoteBook");
const viewQuoteAuthor = document.getElementById("viewQuoteAuthor");
const viewEditBtn = document.getElementById("viewEditBtn");
const viewDeleteBtn = document.getElementById("viewDeleteBtn");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

const backFromAuthorDetail = document.getElementById("backFromAuthorDetail");
const authorNameDetail = document.getElementById("authorNameDetail");
const authorBooksList = document.getElementById("authorBooksList");
const authorQuotesGrid = document.querySelector("#authorQuotesGrid .grid");

const backFromBookDetail = document.getElementById("backFromBookDetail");
const bookTitleDetail = document.getElementById("bookTitleDetail");
const bookAuthorDetail = document.getElementById("bookAuthorDetail");
const bookQuotesGrid = document.querySelector("#bookQuotesGrid .grid");

/* Search Page Elements */
const searchBtn = document.getElementById("searchBtn");
const searchPageElement = document.getElementById("searchPage");
const searchInput = document.getElementById("searchInput");
const searchAuthors = document.querySelector("#searchAuthors .authors-list");
const searchBooks = document.querySelector("#searchBooks .books-list");
const searchQuotesGrid = document.querySelector("#searchQuotes .quotes-grid .grid");

/* Modal Overlay */
const modalOverlay = document.getElementById("modalOverlay");

/*******************************************************************
 * Event Listeners
 ******************************************************************/
// Main Menu
quotesMenuBtn.addEventListener("click", showQuotesPage);
authorsMenuBtn.addEventListener("click", showAuthorsPage);
booksMenuBtn.addEventListener("click", showBooksPage);

// Top Nav
homeBtn.addEventListener("click", showMainMenu);
quotesNavBtn.addEventListener("click", showQuotesPage);
authorsNavBtn.addEventListener("click", showAuthorsPage);
booksNavBtn.addEventListener("click", showBooksPage);

// Search Button
searchBtn.addEventListener("click", showSearchPage);

// Search Input
searchInput.addEventListener("input", handleSearchInput);

// Add/Edit Quote Modal
addQuoteToggle.addEventListener("click", () => {
  editingQuoteId = null;
  openAddQuoteModal();
});
discardBtn.addEventListener("click", () => {
  resetForm();
  closeAddQuoteModal();
});
quoteForm.addEventListener("submit", handleFormSubmit);

// Confirm Deletion Modal
deleteConfirmBtn.addEventListener("click", confirmDeletion);
deleteCancelBtn.addEventListener("click", cancelDeletion);

// View Quote Modal
viewEditBtn.addEventListener("click", () => {
  const quote = quotes.find(q => q.id === currentViewQuoteId);
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

// Export and Import
exportBtn.addEventListener("click", exportQuotes);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", importQuotes);

// Navigation Buttons on Detail Pages
backFromAuthorDetail.addEventListener("click", showAuthorsPage);
backFromBookDetail.addEventListener("click", showBooksPage);

// Clicking outside the View Quote Modal or Confirm Delete Modal => close them
window.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    // Close view quote modal if open
    if (!viewQuoteModal.classList.contains("hidden")) {
      closeViewQuoteModal();
    }
    // Close confirm delete modal if open
    if (!confirmDeleteModal.classList.contains("hidden")) {
      cancelDeletion();
    }
    // Do not close add/edit quote modal when clicking outside
  }
});

/*******************************************************************
 * Page Navigation
 ******************************************************************/
function showMainMenu() {
  mainMenu.classList.remove("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  searchPageElement.classList.add("hidden");
  topNav.classList.add("hidden");

  addQuoteToggle.classList.add("hidden");
  hideOverlay(); // ensure overlay is hidden
}

function showQuotesPage() {
  mainMenu.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  searchPageElement.classList.add("hidden");

  quotesPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  addQuoteToggle.classList.remove("hidden");
  hideOverlay();
  renderQuotes();
}

function showAuthorsPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  searchPageElement.classList.add("hidden");

  authorsPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  addQuoteToggle.classList.add("hidden");
  hideOverlay();
  renderAuthors();
}

function showBooksPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");
  searchPageElement.classList.add("hidden");

  booksPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  addQuoteToggle.classList.add("hidden");
  hideOverlay();
  renderBooks();
}

/*******************************************************************
 * Search Page Navigation
 ******************************************************************/
function showSearchPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.add("hidden");

  searchPageElement.classList.remove("hidden");
  topNav.classList.remove("hidden");
  addQuoteToggle.classList.add("hidden");
  hideOverlay();

  clearSearch();
  searchInput.focus();
}

/*******************************************************************
 * Overlay Handling
 ******************************************************************/
function showOverlay() {
  modalOverlay.classList.remove("hidden");
}

function hideOverlay() {
  modalOverlay.classList.add("hidden");
}

/*******************************************************************
 * Modal Handling
 ******************************************************************/
function openAddQuoteModal() {
  addQuoteMenu.classList.remove("hidden");
  showOverlay();
  // We do NOT allow clicking outside to dismiss
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

  // Update modal content
  viewQuoteText.textContent = quote.quoteText;
  viewQuoteBook.innerHTML = `<a href="#" id="viewBookLink">${quote.bookTitle}</a>`;
  viewQuoteAuthor.innerHTML = `<a href="#" id="viewAuthorLink">${quote.authorName}</a>`;

  viewQuoteModal.classList.remove("hidden");
  showOverlay();

  // Event listeners for navigating to book and author pages
  const viewBookLink = document.getElementById("viewBookLink");
  const viewAuthorLink = document.getElementById("viewAuthorLink");

  // Remove existing listeners to prevent duplicates
  viewBookLink.replaceWith(viewBookLink.cloneNode(true));
  viewAuthorLink.replaceWith(viewAuthorLink.cloneNode(true));

  // Re-select after cloning
  const newViewBookLink = document.getElementById("viewBookLink");
  const newViewAuthorLink = document.getElementById("viewAuthorLink");

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

/*******************************************************************
 * Confirm Deletion
 ******************************************************************/
function confirmDeletion() {
  closeConfirmDeleteModal();

  if (quoteToDeleteId) {
    quotes = quotes.filter((q) => q.id !== quoteToDeleteId);
    deleteQuoteFromDB(quoteToDeleteId).then(() => {
      renderQuotes();
      renderAuthors();
      renderBooks();

      if (!authorDetailPage.classList.contains("hidden")) {
        openAuthorDetailPage(authorNameDetail.textContent);
      }
      if (!bookDetailPage.classList.contains("hidden")) {
        openBookDetailPage(bookTitleDetail.textContent);
      }
      if (!searchPageElement.classList.contains("hidden")) {
        performSearch(searchInput.value.trim());
      }
    });
    quoteToDeleteId = null;
  }
}

function cancelDeletion() {
  quoteToDeleteId = null;
  closeConfirmDeleteModal();
}

/*******************************************************************
 * Form Handling
 ******************************************************************/
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
      await updateQuoteInDB(quotes[index]);
      if (currentViewQuoteId === editingQuoteId) {
        viewQuoteText.textContent = quotes[index].quoteText;
        viewQuoteBook.textContent = quotes[index].bookTitle;
        viewQuoteAuthor.textContent = quotes[index].authorName;
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
    await addQuoteToDB(newQuote);
  }

  resetForm();
  closeAddQuoteModal();
  renderQuotes();
  renderAuthors();
  renderBooks();

  // Refresh detail pages if open
  if (!authorDetailPage.classList.contains("hidden")) {
    openAuthorDetailPage(authorName);
  }
  if (!bookDetailPage.classList.contains("hidden")) {
    openBookDetailPage(bookTitle);
  }
  if (!searchPageElement.classList.contains("hidden")) {
    performSearch(searchInput.value.trim());
  }
}

function resetForm() {
  quoteForm.reset();
  editingQuoteId = null;
}

/*******************************************************************
 * Quotes
 ******************************************************************/
async function loadQuotesFromDB() {
  quotes = await getAllQuotesFromDB();
}

function createQuoteCard(quote) {
  const card = document.createElement("div");
  card.classList.add("quote-card");
  card.setAttribute("data-id", quote.id);

  card.innerHTML = `
    <p class="quote-text">${quote.quoteText}</p>
    <h3 class="quote-book">${quote.bookTitle}</h3>
    <h3 class="quote-author">${quote.authorName}</h3>
    <div class="actions">
      <button class="edit-btn" data-id="${quote.id}" title="Edit">
        <span class="material-icons">edit</span>
      </button>
      <button class="delete-btn" data-id="${quote.id}" title="Delete">
        <span class="material-icons">delete</span>
      </button>
    </div>
  `;

  // Whole card click => view quote
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return; // Ignore clicks on buttons
    openViewQuoteModal(quote.id);
  });

  // Edit and delete buttons
  const editBtn = card.querySelector(".edit-btn");
  const deleteBtn = card.querySelector(".delete-btn");
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    editQuote(e);
  });
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeQuote(e);
  });

  // Clicking on book => book detail
  const bookEl = card.querySelector(".quote-book");
  bookEl.addEventListener("click", (e) => {
    e.stopPropagation();
    openBookDetailPage(quote.bookTitle);
  });

  // Clicking on author => author detail
  const authorEl = card.querySelector(".quote-author");
  authorEl.addEventListener("click", (e) => {
    e.stopPropagation();
    openAuthorDetailPage(quote.authorName);
  });

  return card;
}

function renderQuotes() {
  quotesGrid.innerHTML = "";

  if (!quotes || quotes.length === 0) {
    quotesGrid.innerHTML = "<p>No quotes added yet.</p>";
    return;
  }

  quotes.forEach((quote) => {
    const card = createQuoteCard(quote);
    quotesGrid.appendChild(card);
  });
}

function renderAuthorQuotes(quotesArray) {
  authorQuotesGrid.innerHTML = "";

  if (quotesArray.length === 0) {
    authorQuotesGrid.innerHTML = "<p>No quotes available for this author.</p>";
    return;
  }

  quotesArray.forEach((quote) => {
    const card = createQuoteCard(quote);
    authorQuotesGrid.appendChild(card);
  });
}

function renderBookQuotes(quotesArray) {
  bookQuotesGrid.innerHTML = "";

  if (quotesArray.length === 0) {
    bookQuotesGrid.innerHTML = "<p>No quotes available for this book.</p>";
    return;
  }

  quotesArray.forEach((quote) => {
    const card = createQuoteCard(quote);
    bookQuotesGrid.appendChild(card);
  });
}

/*******************************************************************
 * Authors
 ******************************************************************/
function renderAuthors() {
  authorsList.innerHTML = "";

  if (!quotes || quotes.length === 0) {
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
    const card = document.createElement("div");
    card.classList.add("author-card");
    card.innerHTML = `
      <h3>${authorObj.name}</h3>
      <p>${authorObj.quoteCount} ${authorObj.quoteCount === 1 ? "quote" : "quotes"}</p>
      <p>${authorObj.books.size} ${authorObj.books.size === 1 ? "book" : "books"}</p>
    `;
    card.addEventListener("click", () => {
      openAuthorDetailPage(authorObj.name);
    });
    authorsList.appendChild(card);
  });
}

/*******************************************************************
 * Books
 ******************************************************************/
function renderBooks() {
  booksList.innerHTML = "";

  if (!quotes || quotes.length === 0) {
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
    const card = document.createElement("div");
    card.classList.add("book-card");
    card.innerHTML = `
      <h3>${bookObj.title}</h3>
      <p>By ${bookObj.author}</p>
      <p>${bookObj.quoteCount} ${bookObj.quoteCount === 1 ? "quote" : "quotes"}</p>
    `;
    card.addEventListener("click", () => {
      openBookDetailPage(bookObj.title);
    });
    booksList.appendChild(card);
  });
}

/*******************************************************************
 * Author Detail Page Handling
 ******************************************************************/
function openAuthorDetailPage(authorName) {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.remove("hidden");
  bookDetailPage.classList.add("hidden");
  searchPageElement.classList.add("hidden");
  hideOverlay();

  const authorQuotes = quotes.filter(q => q.authorName.toLowerCase() === authorName.toLowerCase());
  authorNameDetail.textContent = authorName;

  if (!authorQuotes || authorQuotes.length === 0) {
    authorBooksList.innerHTML = "<p>No books available for this author.</p>";
    authorQuotesGrid.innerHTML = "<p>No quotes available for this author.</p>";
    return;
  }

  const booksSet = new Set(authorQuotes.map(q => q.bookTitle));
  const authorBooks = Array.from(booksSet);

  renderAuthorBooks(authorBooks, authorName);
  renderAuthorQuotes(authorQuotes);
}

function renderAuthorBooks(booksArray, authorName) {
  authorBooksList.innerHTML = "";

  if (booksArray.length === 0) {
    authorBooksList.innerHTML = "<p>No books available for this author.</p>";
    return;
  }

  booksArray.forEach((bookTitle) => {
    const card = document.createElement("div");
    card.classList.add("book-card");
    const quoteCount = quotes.filter(q =>
      q.bookTitle.toLowerCase() === bookTitle.toLowerCase()
    ).length;
    card.innerHTML = `
      <h3>${bookTitle}</h3>
      <p>By ${authorName}</p>
      <p>${quoteCount} ${quoteCount === 1 ? "quote" : "quotes"}</p>
    `;
    card.style.cursor = "pointer";
    card.addEventListener("click", () => {
      openBookDetailPage(bookTitle);
    });
    authorBooksList.appendChild(card);
  });
}

/*******************************************************************
 * Book Detail Page Handling
 ******************************************************************/
function openBookDetailPage(bookTitle) {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorDetailPage.classList.add("hidden");
  bookDetailPage.classList.remove("hidden");
  searchPageElement.classList.add("hidden");
  hideOverlay();

  const book = quotes.find(q => q.bookTitle.toLowerCase() === bookTitle.toLowerCase());
  if (!book) {
    bookTitleDetail.textContent = bookTitle;
    bookAuthorDetail.textContent = `By Unknown`;
    bookQuotesGrid.innerHTML = "<p>No quotes available for this book.</p>";
    return;
  }

  bookTitleDetail.textContent = book.bookTitle;
  bookAuthorDetail.textContent = `By ${book.authorName}`;

  const bookQuotes = quotes.filter(q =>
    q.bookTitle.toLowerCase() === bookTitle.toLowerCase()
  );
  renderBookQuotes(bookQuotes);
}

/*******************************************************************
 * Search Functionality
 ******************************************************************/
function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  performSearch(query);
}

function performSearch(query) {
  searchAuthors.innerHTML = "";
  searchBooks.innerHTML = "";
  searchQuotesGrid.innerHTML = "";

  document.getElementById("searchAuthors").classList.add("hidden");
  document.getElementById("searchBooks").classList.add("hidden");
  document.getElementById("searchQuotes").classList.add("hidden");

  if (query === "") {
    return;
  }

  // Search Authors
  const matchedAuthors = Array.from(new Set(quotes
    .filter(q => q.authorName.toLowerCase().includes(query))
    .map(q => q.authorName.trim())
  ));
  if (matchedAuthors.length > 0) {
    document.getElementById("searchAuthors").classList.remove("hidden");
    matchedAuthors.forEach(authorName => {
      const card = document.createElement("div");
      card.classList.add("author-card");
      const count = quotes.filter(q =>
        q.authorName.toLowerCase() === authorName.toLowerCase()
      ).length;
      card.innerHTML = `
        <h3>${authorName}</h3>
        <p>${count} ${count === 1 ? "quote" : "quotes"}</p>
      `;
      card.addEventListener("click", () => {
        openAuthorDetailPage(authorName);
      });
      searchAuthors.appendChild(card);
    });
  }

  // Search Books
  const matchedBooks = Array.from(new Set(quotes
    .filter(q => q.bookTitle.toLowerCase().includes(query))
    .map(q => q.bookTitle.trim())
  ));
  if (matchedBooks.length > 0) {
    document.getElementById("searchBooks").classList.remove("hidden");
    matchedBooks.forEach(bookTitle => {
      const bookObj = quotes.find(q =>
        q.bookTitle.toLowerCase() === bookTitle.toLowerCase()
      );
      const authorName = bookObj ? bookObj.authorName : "Unknown";
      const count = quotes.filter(q =>
        q.bookTitle.toLowerCase() === bookTitle.toLowerCase()
      ).length;
      const card = document.createElement("div");
      card.classList.add("book-card");
      card.innerHTML = `
        <h3>${bookTitle}</h3>
        <p>By ${authorName}</p>
        <p>${count} ${count === 1 ? "quote" : "quotes"}</p>
      `;
      card.addEventListener("click", () => {
        openBookDetailPage(bookTitle);
      });
      searchBooks.appendChild(card);
    });
  }

  // Search Quotes
  const matchedQuotes = quotes.filter(q =>
    q.quoteText.toLowerCase().includes(query) ||
    q.bookTitle.toLowerCase().includes(query) ||
    q.authorName.toLowerCase().includes(query)
  );
  if (matchedQuotes.length > 0) {
    document.getElementById("searchQuotes").classList.remove("hidden");
    matchedQuotes.forEach(quote => {
      const card = createQuoteCard(quote);
      searchQuotesGrid.appendChild(card);
    });
  }
}

function clearSearch() {
  searchInput.value = "";
  searchAuthors.innerHTML = "";
  searchBooks.innerHTML = "";
  searchQuotesGrid.innerHTML = "";

  document.getElementById("searchAuthors").classList.add("hidden");
  document.getElementById("searchBooks").classList.add("hidden");
  document.getElementById("searchQuotes").classList.add("hidden");
}

/*******************************************************************
 * Export & Import
 ******************************************************************/
function exportQuotes() {
  if (!quotes || quotes.length === 0) {
    alert("No quotes to export.");
    return;
  }

  const headers = ["Quote", "Book Title", "Author Name"];
  const rows = quotes.map(q =>
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
  reader.onload = async function(e) {
    const content = e.target.result;
    const lines = content.split("\n").filter(line => line.trim() !== "");

    if (lines.length < 2) {
      alert("CSV file does not contain data.");
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const quoteIndex = headers.indexOf("quote");
    const bookTitleIndex = headers.indexOf("book title");
    const authorNameIndex = headers.indexOf("author name");

    if (quoteIndex === -1 || bookTitleIndex === -1 || authorNameIndex === -1) {
      alert("Invalid CSV format. Please ensure the headers are: Quote, Book Title, Author Name.");
      return;
    }

    const newQuotes = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      const quoteText = values[quoteIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const bookTitle = values[bookTitleIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const authorName = values[authorNameIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();

      if (quoteText && bookTitle && authorName) {
        const duplicate = quotes.find(q =>
          q.quoteText === quoteText &&
          q.bookTitle === bookTitle &&
          q.authorName === authorName
        );
        if (!duplicate) {
          const newQuote = {
            id: crypto.randomUUID(),
            quoteText,
            bookTitle,
            authorName
          };
          newQuotes.push(newQuote);
        }
      }
    }

    if (newQuotes.length === 0) {
      alert("No new quotes to import or all quotes are duplicates.");
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

    renderQuotes();
    renderAuthors();
    renderBooks();
    performSearch(searchInput.value.trim());
    alert(`${newQuotes.length} quote(s) imported successfully.`);
  };

  reader.onerror = () => {
    alert("Failed to read the file.");
  };

  reader.readAsText(file);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/*******************************************************************
 * On Page Load
 ******************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await openDB();
    await loadQuotesFromDB();
    showMainMenu();
  } catch (error) {
    console.error(error);
    alert("Failed to initialize the application.");
  }
});

/*******************************************************************
 * Quote Card Event Handling
 ******************************************************************/
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
