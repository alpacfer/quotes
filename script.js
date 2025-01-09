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

// Modal & Form
addQuoteToggle.addEventListener("click", openAddQuoteModal);
closeFormBtn.addEventListener("click", closeAddQuoteModal);
discardBtn.addEventListener("click", () => {
  resetForm();
  closeAddQuoteModal();
});
quoteForm.addEventListener("submit", handleFormSubmit);

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
  renderBooks();
}

/*******************************************************************
 * Modal Handling
 ******************************************************************/
function openAddQuoteModal() {
  editingQuoteId = null;
  addQuoteMenu.classList.remove("hidden");
}

function closeAddQuoteModal() {
  addQuoteMenu.classList.add("hidden");
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
    // Update existing quote
    const index = quotes.findIndex((q) => q.id === editingQuoteId);
    if (index !== -1) {
      quotes[index].quoteText = quoteText;
      quotes[index].bookTitle = bookTitle;
      quotes[index].authorName = authorName;
      await updateQuoteInDB(quotes[index]);
    }
    editingQuoteId = null;
  } else {
    // Add new quote
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

    // Optionally shorten the displayed text
    const shortText = 
      quote.quoteText.length > 50
        ? quote.quoteText.slice(0, 50).split(" ").slice(0, -1).join(" ") + "..."
        : quote.quoteText;

    card.innerHTML = `
      <p>"${shortText}"</p>
      <h3>${quote.bookTitle} - ${quote.authorName}</h3>
      <div class="actions">
        <!-- Pen (Edit) and Trash (Delete) icons -->
        <button class="edit-btn" data-id="${quote.id}" title="Edit">✎</button>
        <button class="delete-btn" data-id="${quote.id}" title="Delete">🗑</button>
      </div>
    `;
    quotesGrid.appendChild(card);
  });

  attachQuoteEventListeners();
}

function attachQuoteEventListeners() {
  const editButtons = document.querySelectorAll(".edit-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  editButtons.forEach((btn) => {
    btn.addEventListener("click", editQuote);
  });
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", removeQuote);
  });
}

function editQuote(e) {
  const quoteId = e.target.getAttribute("data-id");
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

async function removeQuote(e) {
  const quoteId = e.target.getAttribute("data-id");
  if (!confirm("Do you want to delete this quote?")) return;

  quotes = quotes.filter((q) => q.id !== quoteId);
  await deleteQuoteFromDB(quoteId);
  renderQuotes();
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
      <p>${authorObj.quoteCount} ${
        authorObj.quoteCount === 1 ? "quote" : "quotes"
      }</p>
      <p>${authorObj.books.size} ${
        authorObj.books.size === 1 ? "book" : "books"
      }</p>
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
      <p>${bookObj.quoteCount} ${
        bookObj.quoteCount === 1 ? "quote" : "quotes"
      }</p>
    `;
    booksList.appendChild(card);
  });
}

/*******************************************************************
 * On Page Load
 ******************************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  await openDB();
  await loadQuotesFromDB();
  showMainMenu();
});
