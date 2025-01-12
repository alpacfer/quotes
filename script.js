/********************************************************
 * IndexedDB Setup
 ********************************************************/
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
// Sidebar & Flap
const sidePanel = document.getElementById("sidePanel");
const sideFlap = document.getElementById("sideFlap");
const sidebarHoverArea = document.getElementById("sidebarHoverArea");

// Main Nav Buttons
const homeSideBtn = document.getElementById("homeSideBtn");
const authorsSideBtn = document.getElementById("authorsSideBtn");
const booksSideBtn = document.getElementById("booksSideBtn");

// Toggle Theme
const toggleThemeBtn = document.getElementById("toggleThemeBtn");

// Main: Quotes Page
const quotesPage = document.getElementById("quotesPage");
const quotesSearchInput = document.getElementById("quotesSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const addQuoteToggle = document.getElementById("addQuoteToggle");
const defaultQuotesGrid = document.getElementById("defaultQuotesGrid");
const searchResultsGrid = document.getElementById("searchResultsGrid");

// Search Sections
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
const tagsInput = document.getElementById("tagsInput");
const discardBtn = document.getElementById("discardBtn");
const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const viewQuoteModal = document.getElementById("viewQuoteModal");
const viewQuoteText = document.getElementById("viewQuoteText");
const viewAuthorBookCard = document.getElementById("viewAuthorBookCard");
const viewAuthorBookTitle = document.getElementById("viewAuthorBookTitle");
const viewAuthorBookAuthor = document.getElementById("viewAuthorBookAuthor");
const viewQuoteTags = document.getElementById("viewQuoteTags");
const copyQuoteBtn = document.getElementById("copyQuoteBtn");

// DataLists
const booksDataList = document.getElementById("booksDataList");
const authorsDataList = document.getElementById("authorsDataList");

// Import / Export
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

/********************************************************
 * Event Listeners
 ********************************************************/
// Sidebar Hover
sidebarHoverArea.addEventListener("mouseenter", openSidePanel);
sidePanel.addEventListener("mouseenter", openSidePanel);
sidePanel.addEventListener("mouseleave", closeSidePanel);

// Nav Buttons
homeSideBtn.addEventListener("click", () => {
  showQuotesPage();
  closeSidePanel();
});
authorsSideBtn.addEventListener("click", () => {
  showAuthorsPage();
  closeSidePanel();
});
booksSideBtn.addEventListener("click", () => {
  showBooksPage();
  closeSidePanel();
});

// Toggle Theme
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Back Buttons
backFromAuthors.addEventListener("click", handleBackClick);
backFromBooks.addEventListener("click", handleBackClick);
backFromAuthorDetail.addEventListener("click", handleBackClick);
backFromBookDetail.addEventListener("click", handleBackClick);

function handleBackClick() {
  if (window.history.length > 1) {
    history.back();
  } else {
    showQuotesPage();
  }
}

// Quotes Page
quotesSearchInput.addEventListener("input", debounce(handleSearchInput, 300));
clearSearchBtn.addEventListener("click", clearSearchField);
addQuoteToggle.addEventListener("click", () => {
  editingQuoteId = null;
  openAddQuoteModal();
});

// Add/Edit Quote Modal
discardBtn.addEventListener("click", () => {
  resetForm();
  closeAddQuoteModal();
});
quoteForm.addEventListener("submit", handleFormSubmit);

// Confirm Deletion
deleteConfirmBtn.addEventListener("click", confirmDeletion);
deleteCancelBtn.addEventListener("click", cancelDeletion);

// View Quote Modal: Copy Button
copyQuoteBtn.addEventListener("click", copyQuoteToClipboard);

// Window click for closing modals if clicked outside the content
window.addEventListener("click", (event) => {
  // If user clicked on the overlay itself
  if (event.target === modalOverlay) {
    // Close View Quote Modal if open
    if (!viewQuoteModal.classList.contains("hidden")) {
      closeViewQuoteModal();
    }
    // Close Confirm Delete if open
    if (!confirmDeleteModal.classList.contains("hidden")) {
      cancelDeletion();
    }
    // DO NOT close addQuoteMenu when clicked outside, as per earlier requirements
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
    closeSidePanel();
  } catch (error) {
    console.error(error);
    alert("Failed to initialize the application.");
  }
});

/********************************************************
 * Page Navigation
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
 * Modal Handling
 ********************************************************/
function showOverlay() {
  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function hideOverlay() {
  modalOverlay.classList.add("hidden");
  document.body.style.overflow = "auto";
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
  if (!quote) return;

  currentViewQuoteId = id;
  viewQuoteText.textContent = quote.quoteText;
  viewAuthorBookTitle.textContent = quote.bookTitle;
  viewAuthorBookAuthor.textContent = `By ${quote.authorName}`;

  viewQuoteTags.innerHTML = "";
  if (quote.tags && quote.tags.length) {
    quote.tags.forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.classList.add("tag");
      tagEl.textContent = tag;
      viewQuoteTags.appendChild(tagEl);
    });
  }

  // Rebind the author/book card
  viewAuthorBookCard.replaceWith(viewAuthorBookCard.cloneNode(true));
  const newCard = document.getElementById("viewAuthorBookCard");
  newCard.addEventListener("click", () => {
    openAuthorDetailPage(quote.authorName);
    closeViewQuoteModal();
  }, { once: true });

  viewQuoteModal.classList.remove("hidden");
  showOverlay();
}

function closeViewQuoteModal() {
  viewQuoteModal.classList.add("hidden");
  hideOverlay();
}

/********************************************************
 * Confirm Deletion
 ********************************************************/
function openConfirmDeleteModal() {
  confirmDeleteModal.classList.remove("hidden");
  showOverlay();
}

function closeConfirmDeleteModal() {
  confirmDeleteModal.classList.add("hidden");
  hideOverlay();
}

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
 * Form Handling
 ********************************************************/
function handleFormSubmit(e) {
  e.preventDefault();
  saveQuote();
}

async function saveQuote() {
  const quoteText = quoteTextInput.value.trim();
  const bookTitle = bookTitleInput.value.trim();
  const authorName = authorNameInput.value.trim();
  const tagsRaw = tagsInput.value.trim();

  let tags = [];
  if (tagsRaw) {
    tags = tagsRaw.split(",").map((t) => t.trim()).filter((t) => t);
    tags = tags.slice(0, 5);
    const tagPattern = /^[a-zA-Z0-9\-]+$/;
    for (const tag of tags) {
      if (!tagPattern.test(tag)) {
        alert("Tags must be single words or compound words separated by hyphens.");
        return;
      }
    }
  }

  if (!quoteText || !bookTitle || !authorName) {
    alert("Please fill in all required fields.");
    return;
  }

  if (editingQuoteId) {
    const idx = quotes.findIndex((q) => q.id === editingQuoteId);
    if (idx !== -1) {
      quotes[idx].quoteText = quoteText;
      quotes[idx].bookTitle = bookTitle;
      quotes[idx].authorName = authorName;
      quotes[idx].tags = tags;
      try {
        await updateQuoteInDB(quotes[idx]);
      } catch (error) {
        console.error(error);
        alert("Failed to update the quote.");
      }
    }
    editingQuoteId = null;
  } else {
    const newQuote = {
      id: crypto.randomUUID(),
      quoteText,
      bookTitle,
      authorName,
      tags,
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
  handleSearchInput();
  renderAuthors();
  renderBooks();
  updateSidePanel();
  updateDataLists();
}

function resetForm() {
  quoteForm.reset();
  editingQuoteId = null;
}

/********************************************************
 * Load & Render
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
    alert("Failed to load quotes from the DB.");
  }
}

/********************************************************
 * Autocomplete DataLists
 ********************************************************/
function updateDataLists() {
  const uniqueBooks = [...new Set(quotes.map((q) => q.bookTitle.trim()))];
  booksDataList.innerHTML = uniqueBooks
    .map((b) => `<option value="${b}">`)
    .join("");

  const uniqueAuthors = [...new Set(quotes.map((q) => q.authorName.trim()))];
  authorsDataList.innerHTML = uniqueAuthors
    .map((a) => `<option value="${a}">`)
    .join("");
}

/********************************************************
 * Search
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
    if (!quotes.length) {
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
  if (matchedQuotes.length) {
    searchQuotesSection.classList.remove("hidden");
    matchedQuotes.forEach((quote) => {
      const card = createCard(quote, "quote");
      searchQuotesGrid.appendChild(card);
    });
  } else {
    searchQuotesSection.classList.add("hidden");
  }

  // Render authors
  if (matchedAuthors.length) {
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
  if (matchedBooks.length) {
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
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
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

  if (!quotes.length) {
    authorsList.innerHTML = "<p>No authors to display.</p>";
    return;
  }

  const map = {};
  quotes.forEach((q) => {
    const key = q.authorName.trim().toLowerCase();
    if (!map[key]) {
      map[key] = { name: q.authorName.trim(), quoteCount: 0, books: new Set() };
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

  if (!quotes.length) {
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
  if (booksSet.size) {
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

  if (authorQuotes.length) {
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
  if (!bookQuotes.length) {
    bookTitleDetail.textContent = bookTitle;
    bookAuthorDetail.textContent = "By Unknown";
    bookQuotesGrid.innerHTML = "<p>No quotes available for this book.</p>";
    return;
  }

  const book = bookQuotes[0];
  bookTitleDetail.textContent = book.bookTitle;
  bookAuthorDetail.textContent = `By ${book.authorName}`;

  if (bookQuotes.length) {
    bookQuotesGrid.innerHTML = "";
    bookQuotes.forEach((qt) => {
      const card = createCard(qt, "quote");
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
  if (!quotes.length) {
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

function importQuotes(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (ev) {
    const content = ev.target.result;
    const lines = content.split("\n").filter((line) => line.trim());

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
          newQuotes.push({
            id: crypto.randomUUID(),
            quoteText,
            bookTitle,
            authorName,
            tags: [],
          });
        }
      }
    }

    if (!newQuotes.length) {
      alert("No new quotes or all duplicates.");
      return;
    }

    for (const qt of newQuotes) {
      try {
        await addQuoteToDB(qt);
        quotes.push(qt);
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
 * CSV Parsing
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
 * Sidebar Update
 ********************************************************/
function updateSidePanel() {
  // Potential dynamic updates in the future
}

/********************************************************
 * createCard Utility
 ********************************************************/
function createCard(item, type) {
  const card = document.createElement("div");
  card.classList.add("card");

  // 3D tilt
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const cardWidth = rect.width;
    const cardHeight = rect.height;
    const centerX = rect.left + cardWidth / 2;
    const centerY = rect.top + cardHeight / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    const rotateMax = 1;
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
      <div class="quote-details">
        <span class="quote-book">${item.bookTitle}</span>
        <span class="quote-author">${item.authorName}</span>
      </div>
      <div class="actions">
        <button class="edit-btn" data-id="${item.id}" title="Edit">
          <span class="material-icons">edit</span>
        </button>
        <button class="delete-btn" data-id="${item.id}" title="Delete">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;

    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");
    const bookEl = card.querySelector(".quote-book");
    const authorEl = card.querySelector(".quote-author");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editQuote(e);
    });
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeQuote(e);
    });
    bookEl.addEventListener("click", (e) => {
      e.stopPropagation();
      openBookDetailPage(item.bookTitle);
    });
    authorEl.addEventListener("click", (e) => {
      e.stopPropagation();
      openAuthorDetailPage(item.authorName);
    });

    card.addEventListener("click", () => {
      openViewQuoteModal(item.id);
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

/********************************************************
 * Edit/Delete Utility
 ********************************************************/
function editQuote(e) {
  const quoteId = e.target.closest("button").getAttribute("data-id");
  const quoteToEdit = quotes.find((q) => q.id === quoteId);
  if (!quoteToEdit) return;

  editingQuoteId = quoteId;
  quoteTextInput.value = quoteToEdit.quoteText;
  bookTitleInput.value = quoteToEdit.bookTitle;
  authorNameInput.value = quoteToEdit.authorName;
  tagsInput.value = quoteToEdit.tags ? quoteToEdit.tags.join(", ") : "";
  openAddQuoteModal();
}

function removeQuote(e) {
  const quoteId = e.target.closest("button").getAttribute("data-id");
  quoteToDeleteId = quoteId;
  openConfirmDeleteModal();
}

/********************************************************
 * Sidebar Hover
 ********************************************************/
function openSidePanel() {
  sidePanel.classList.remove("collapsed");
  sidePanel.classList.add("open");
}

function closeSidePanel() {
  sidePanel.classList.add("collapsed");
  sidePanel.classList.remove("open");
}

/********************************************************
 * Copy Quote
 ********************************************************/
function copyQuoteToClipboard() {
  const quote = quotes.find((q) => q.id === currentViewQuoteId);
  if (!quote) return;

  const textToCopy = `"${quote.quoteText}"\n— ${quote.authorName}, "${quote.bookTitle}"`;
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      console.log("Quote copied to clipboard.");
    })
    .catch((err) => {
      console.error("Could not copy text:", err);
    });
}
