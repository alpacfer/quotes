/*******************************************************************
 * IndexedDB Setup
 ******************************************************************/
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
let quoteToDeleteId = null; // Used for confirm deletion
let currentViewQuoteId = null; // Used for viewing a quote

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

const quotesMenuBtn = document.getElementById("quotesMenu");
const authorsMenuBtn = document.getElementById("authorsMenu");
const booksMenuBtn = document.getElementById("booksMenu");

const addQuoteToggle = document.getElementById("addQuoteToggle");
const addQuoteMenu = document.getElementById("addQuoteMenu");
const closeFormBtn = document.getElementById("closeFormBtn");
const quoteForm = document.getElementById("quoteForm");
const quoteTextInput = document.getElementById("quoteText");
const bookTitleInput = document.getElementById("bookTitle");
const authorNameInput = document.getElementById("authorName");
const discardBtn = document.getElementById("discardBtn");

const quotesGrid = document.querySelector(".grid");
const authorsList = document.getElementById("authorsList");
const booksList = document.getElementById("booksList");

const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");

const viewQuoteModal = document.getElementById("viewQuoteModal");
const closeViewModalBtn = document.getElementById("closeViewModalBtn");
const viewQuoteText = document.getElementById("viewQuoteText");
const viewQuoteDetails = document.getElementById("viewQuoteDetails");
const viewEditBtn = document.getElementById("viewEditBtn");
const viewDeleteBtn = document.getElementById("viewDeleteBtn");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

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

// Add/Edit Quote Modal
addQuoteToggle.addEventListener("click", () => {
  // Only reset editingQuoteId if we're truly adding new
  editingQuoteId = null;
  openAddQuoteModal();
});
closeFormBtn.addEventListener("click", closeAddQuoteModal);
discardBtn.addEventListener("click", () => {
  resetForm();
  closeAddQuoteModal();
});
quoteForm.addEventListener("submit", handleFormSubmit);

// Confirm Deletion Modal
deleteConfirmBtn.addEventListener("click", confirmDeletion);
deleteCancelBtn.addEventListener("click", cancelDeletion);

// View Quote Modal
closeViewModalBtn.addEventListener("click", () => {
  viewQuoteModal.classList.add("hidden");
  currentViewQuoteId = null;
});
viewEditBtn.addEventListener("click", () => {
  // Open Add/Edit modal with current quote data
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
  // Trigger deletion via confirm deletion modal
  quoteToDeleteId = currentViewQuoteId;
  confirmDeleteModal.classList.remove("hidden");
  // Close view modal
  viewQuoteModal.classList.add("hidden");
  currentViewQuoteId = null;
});

// Export and Import
exportBtn.addEventListener("click", exportQuotes);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", importQuotes);

// Click outside modals to dismiss
window.addEventListener("click", (event) => {
  if (event.target === addQuoteMenu) {
    closeAddQuoteModal();
  }
  if (event.target === confirmDeleteModal) {
    cancelDeletion();
  }
  if (event.target === viewQuoteModal) {
    viewQuoteModal.classList.add("hidden");
    currentViewQuoteId = null;
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
  topNav.classList.add("hidden");

  // Hide + icon in main menu
  addQuoteToggle.classList.add("hidden");
}

function showQuotesPage() {
  mainMenu.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");

  quotesPage.classList.remove("hidden");
  topNav.classList.remove("hidden");

  // Show + icon on the Quotes page
  addQuoteToggle.classList.remove("hidden");

  renderQuotes();
}

function showAuthorsPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  booksPage.classList.add("hidden");

  authorsPage.classList.remove("hidden");
  topNav.classList.remove("hidden");

  addQuoteToggle.classList.add("hidden");
  renderAuthors();
}

function showBooksPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");

  booksPage.classList.remove("hidden");
  topNav.classList.remove("hidden");

  addQuoteToggle.classList.add("hidden");
}

/*******************************************************************
 * Modal Handling
 ******************************************************************/
function openAddQuoteModal() {
  // Show the Add/Edit quote modal
  addQuoteMenu.classList.remove("hidden");
}

function closeAddQuoteModal() {
  addQuoteMenu.classList.add("hidden");
}

function closeViewQuoteModal() {
  viewQuoteModal.classList.add("hidden");
  currentViewQuoteId = null;
}

/*******************************************************************
 * Confirm Deletion
 ******************************************************************/
function confirmDeletion() {
  // Close confirm deletion modal
  confirmDeleteModal.classList.add("hidden");

  if (quoteToDeleteId) {
    // Remove quote from memory
    quotes = quotes.filter((q) => q.id !== quoteToDeleteId);

    // Remove from IndexedDB
    deleteQuoteFromDB(quoteToDeleteId).then(() => {
      renderQuotes();
      // If a view modal was open for this quote, close it
      if (currentViewQuoteId === quoteToDeleteId) {
        closeViewQuoteModal();
      }
    });

    // Reset ID
    quoteToDeleteId = null;
  }
}

function cancelDeletion() {
  // Reset and close modal without action
  quoteToDeleteId = null;
  confirmDeleteModal.classList.add("hidden");
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

  // If editingQuoteId is set, update existing
  if (editingQuoteId) {
    const index = quotes.findIndex((q) => q.id === editingQuoteId);
    if (index !== -1) {
      quotes[index].quoteText = quoteText;
      quotes[index].bookTitle = bookTitle;
      quotes[index].authorName = authorName;
      await updateQuoteInDB(quotes[index]);

      // If viewing this quote, update view modal
      if (currentViewQuoteId === editingQuoteId) {
        viewQuoteText.textContent = quotes[index].quoteText;
        viewQuoteDetails.textContent = `${quotes[index].bookTitle} - ${quotes[index].authorName}`;
      }
    }
    editingQuoteId = null;
  } else {
    // Otherwise, create a new quote
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

function renderQuotes() {
  quotesGrid.innerHTML = "";

  if (!quotes || quotes.length === 0) {
    quotesGrid.innerHTML = "<p>No quotes added yet.</p>";
    return;
  }

  quotes.forEach((quote) => {
    const card = document.createElement("div");
    card.classList.add("quote-card");
    card.setAttribute("data-id", quote.id);

    const shortText =
      quote.quoteText.length > 100
        ? quote.quoteText.slice(0, 100).split(" ").slice(0, -1).join(" ") + "..."
        : quote.quoteText;

    card.innerHTML = `
      <p>"${shortText}"</p>
      <h3>${quote.bookTitle}</h3>
      <h3> - ${quote.authorName}</h3>
      <div class="actions">
        <!-- Edit and Delete Buttons -->
        <button class="edit-btn" data-id="${quote.id}" title="Edit">
          <span class="material-icons">edit</span>
        </button>
        <button class="delete-btn" data-id="${quote.id}" title="Delete">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;

    // Add event listener for viewing the quote
    card.addEventListener("click", (e) => {
      // Prevent triggering when clicking on edit/delete buttons
      if (e.target.closest("button")) return;
      openViewQuoteModal(quote.id);
    });

    quotesGrid.appendChild(card);
  });

  attachQuoteEventListeners();
}

function attachQuoteEventListeners() {
  const editButtons = document.querySelectorAll(".edit-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering card click
      editQuote(e);
    });
  });
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent triggering card click
      removeQuote(e);
    });
  });
}

function editQuote(e) {
  // Get the quote's ID
  const quoteId = e.target.closest("button").getAttribute("data-id");
  const quoteToEdit = quotes.find((q) => q.id === quoteId);

  if (!quoteToEdit) {
    alert("Quote not found.");
    return;
  }

  // Set editing mode
  editingQuoteId = quoteId;

  // Populate the form
  quoteTextInput.value = quoteToEdit.quoteText;
  bookTitleInput.value = quoteToEdit.bookTitle;
  authorNameInput.value = quoteToEdit.authorName;

  // Open the modal
  openAddQuoteModal();
}

function removeQuote(e) {
  // Get the quote's ID
  const quoteId = e.target.closest("button").getAttribute("data-id");

  // Store quote ID and open confirm deletion modal
  quoteToDeleteId = quoteId;
  confirmDeleteModal.classList.remove("hidden");
}

function openViewQuoteModal(id) {
  const quote = quotes.find(q => q.id === id);
  if (!quote) {
    alert("Quote not found.");
    return;
  }

  currentViewQuoteId = id;
  viewQuoteText.textContent = `"${quote.quoteText}"`;
  viewQuoteDetails.textContent = `${quote.bookTitle} - ${quote.authorName}`;

  viewQuoteModal.classList.remove("hidden");
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
    booksList.appendChild(card);
  });
}

/*******************************************************************
 * Import & Export Functionality
 ******************************************************************/
function exportQuotes() {
  if (!quotes || quotes.length === 0) {
    alert("No quotes to export.");
    return;
  }

  // Prepare CSV headers
  const headers = ["Quote", "Book Title", "Author Name"];
  const rows = quotes.map(q => `"${q.quoteText.replace(/"/g, '""')}", "${q.bookTitle.replace(/"/g, '""')}", "${q.authorName.replace(/"/g, '""')}"`);

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link to download the Blob
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "quotes_export.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);

  // Trigger the download
  link.click();

  // Cleanup
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

    // Assuming first line is headers
    const headers = lines[0].split(",").map(header => header.trim().toLowerCase());
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
      if (values.length < 3) continue; // Skip incomplete lines

      const quoteText = values[quoteIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const bookTitle = values[bookTitleIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const authorName = values[authorNameIndex].replace(/^"|"$/g, '').replace(/""/g, '"').trim();

      if (quoteText && bookTitle && authorName) {
        // Check for duplicates
        const duplicate = quotes.find(q => q.quoteText === quoteText && q.bookTitle === bookTitle && q.authorName === authorName);
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

    // Add new quotes to IndexedDB
    for (const quote of newQuotes) {
      try {
        await addQuoteToDB(quote);
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to add quote: ${error}`);
      }
    }

    renderQuotes();
    alert(`${newQuotes.length} quote(s) imported successfully.`);
  };

  reader.onerror = () => {
    alert("Failed to read the file.");
  };

  reader.readAsText(file);
}

// Utility function to parse a CSV line considering quotes
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' ) {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++; // Skip the escaped quote
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
