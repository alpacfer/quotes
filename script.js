// Initialize quotes array from localStorage
let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

/* ---------------
   DOM Elements
---------------- */
const topNav = document.getElementById("topNav");
const homeBtn = document.getElementById("homeBtn");
const quotesNavBtn = document.getElementById("quotesNavBtn");
const authorsNavBtn = document.getElementById("authorsNavBtn");
const booksNavBtn = document.getElementById("booksNavBtn");

const mainMenu = document.getElementById("mainMenu");
const quotesPage = document.getElementById("quotesPage");
const authorsPage = document.getElementById("authorsPage");

const quotesMenuBtn = document.getElementById("quotesMenu");
const authorsMenuBtn = document.getElementById("authorsMenu");
const booksMenuMainBtn = document.getElementById("booksMenu");

const quoteForm = document.getElementById("quoteForm");
const quotesGrid = document.querySelector(".grid");
const authorsList = document.getElementById("authorsList");

const booksPage = document.getElementById("booksPage");
const booksList = document.getElementById("booksList");

/* ---------------
   Event Listeners
----------------- */
// Main Menu Buttons
quotesMenuBtn.addEventListener("click", showQuotesPage);
authorsMenuBtn.addEventListener("click", showAuthorsPage);
booksMenuMainBtn.addEventListener("click", showBooksPage);

// Top Nav Buttons
homeBtn.addEventListener("click", showMainMenu);
quotesNavBtn.addEventListener("click", showQuotesPage);
authorsNavBtn.addEventListener("click", showAuthorsPage);
booksNavBtn.addEventListener("click", showBooksPage);

// Add Quote Form
quoteForm.addEventListener("submit", addQuote);

/* ---------------
   Navigation
----------------- */
function showMainMenu() {
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  topNav.classList.add("hidden");
}

function showQuotesPage() {
  mainMenu.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  quotesPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  renderQuotes();
}

function showAuthorsPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  booksPage.classList.add("hidden");
  authorsPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  renderAuthors();
}

function showBooksPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  booksPage.classList.remove("hidden");
  topNav.classList.remove("hidden");
  renderBooks();
}

/* ---------------
   Quotes Logic
----------------- */
function addQuote(e) {
  e.preventDefault();

  const quoteText = document.getElementById("quoteText").value.trim();
  const bookTitle = document.getElementById("bookTitle").value.trim();
  const authorName = document.getElementById("authorName").value.trim();

  if (!quoteText || !bookTitle || !authorName) {
    alert("Please fill in all required fields.");
    return;
  }

  const newQuote = {
    id: crypto.randomUUID(),
    quoteText,
    bookTitle,
    authorName
  };

  quotes.push(newQuote);
  saveQuotes();

  quoteForm.reset();
  renderQuotes();
}

function renderQuotes() {
  quotesGrid.innerHTML = "";

  if (quotes.length === 0) {
    quotesGrid.innerHTML = "<p>No quotes added yet.</p>";
    return;
  }

  quotes.forEach((quote) => {
    const card = document.createElement("div");
    card.classList.add("quote-card");

    const quotePreview =
      quote.quoteText.length > 50
        ? quote.quoteText.substring(0, 50).split(" ").slice(0, -1).join(" ") + "..."
        : quote.quoteText;

    card.innerHTML = `
      <p>"${quotePreview}"</p>
      <h3>${quote.bookTitle} - ${quote.authorName}</h3>
      <div class="actions">
        <button class="edit-btn" data-id="${quote.id}">Edit</button>
        <button class="delete-btn" data-id="${quote.id}">Delete</button>
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
    btn.addEventListener("click", deleteQuote);
  });
}

function deleteQuote(e) {
  const quoteId = e.target.getAttribute("data-id");
  if (confirm("Are you sure you want to delete this quote?")) {
    quotes = quotes.filter((quote) => quote.id !== quoteId);
    saveQuotes();
    renderQuotes();
  }
}

function editQuote(e) {
  const quoteId = e.target.getAttribute("data-id");
  const quoteToEdit = quotes.find((q) => q.id === quoteId);

  if (!quoteToEdit) {
    alert("Quote not found.");
    return;
  }

  document.getElementById("quoteText").value = quoteToEdit.quoteText;
  document.getElementById("bookTitle").value = quoteToEdit.bookTitle;
  document.getElementById("authorName").value = quoteToEdit.authorName;

  deleteQuote({ target: { getAttribute: () => quoteId } });
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

/* ---------------
   Authors Logic
----------------- */
function renderAuthors() {
  authorsList.innerHTML = "";

  if (quotes.length === 0) {
    authorsList.innerHTML = "<p>No authors to display.</p>";
    return;
  }

  const authorsMap = quotes.reduce((acc, quote) => {
    const author = quote.authorName.trim().toLowerCase();
    const book = quote.bookTitle.trim();

    if (author) {
      if (!acc[author]) {
        acc[author] = { name: quote.authorName, quoteCount: 0, books: new Set() };
      }
      acc[author].quoteCount++;
      acc[author].books.add(book);
    }

    return acc;
  }, {});

  Object.values(authorsMap).sort((a, b) => a.name.localeCompare(b.name)).forEach(({ name, quoteCount, books }) => {
    const card = document.createElement("div");
    card.classList.add("author-card");

    card.innerHTML = `
      <h3>${name}</h3>
      <p>${quoteCount} ${quoteCount === 1 ? "quote" : "quotes"}</p>
      <p>${books.size} ${books.size === 1 ? "book" : "books"}</p>
    `;

    authorsList.appendChild(card);
  });
}

function renderBooks() {
  booksList.innerHTML = "";

  if (quotes.length === 0) {
    booksList.innerHTML = "<p>No books to display.</p>";
    return;
  }

  const booksMap = quotes.reduce((acc, quote) => {
    const book = quote.bookTitle.trim().toLowerCase();

    if (book) {
      if (!acc[book]) {
        acc[book] = { title: quote.bookTitle, author: quote.authorName, quoteCount: 0 };
      }
      acc[book].quoteCount++;
    }

    return acc;
  }, {});

  Object.values(booksMap).sort((a, b) => a.title.localeCompare(b.title)).forEach(({ title, author, quoteCount }) => {
    const card = document.createElement("div");
    card.classList.add("book-card");

    card.innerHTML = `
      <h3>${title}</h3>
      <p>By ${author}</p>
      <p>${quoteCount} ${quoteCount === 1 ? "quote" : "quotes"}</p>
    `;

    booksList.appendChild(card);
  });
}

/* ---------------
   On Page Load
----------------- */
document.addEventListener("DOMContentLoaded", () => {
  showMainMenu();
});
