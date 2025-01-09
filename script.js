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

/* ---------------
   Event Listeners
----------------- */
// Main Menu Buttons
quotesMenuBtn.addEventListener("click", showQuotesPage);
authorsMenuBtn.addEventListener("click", showAuthorsPage);
booksMenuMainBtn.addEventListener("click", notImplementedAlert);

// Top Nav Buttons
homeBtn.addEventListener("click", showMainMenu);
quotesNavBtn.addEventListener("click", showQuotesPage);
authorsNavBtn.addEventListener("click", showAuthorsPage);
booksNavBtn.addEventListener("click", notImplementedAlert);

// Add Quote Form
quoteForm.addEventListener("submit", addQuote);

/* ---------------
   Navigation
----------------- */
function showMainMenu() {
  // Hide pages
  quotesPage.classList.add("hidden");
  authorsPage.classList.add("hidden");
  // Show Main Menu
  mainMenu.classList.remove("hidden");
  // Hide top nav
  topNav.classList.add("hidden");
}

function showQuotesPage() {
  mainMenu.classList.add("hidden");
  authorsPage.classList.add("hidden");
  quotesPage.classList.remove("hidden");
  // Show top nav
  topNav.classList.remove("hidden");

  renderQuotes();
}

function showAuthorsPage() {
  mainMenu.classList.add("hidden");
  quotesPage.classList.add("hidden");
  authorsPage.classList.remove("hidden");
  // Show top nav
  topNav.classList.remove("hidden");

  renderAuthors();
}

function notImplementedAlert() {
  alert("Feature not yet implemented.");
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
    id: Date.now(),
    quoteText,
    bookTitle,
    authorName
  };

  quotes.push(newQuote);
  saveQuotes();

  // Clear form
  quoteForm.reset();

  // Stay on Quotes page and re-render
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
        ? quote.quoteText.substring(0, 50) + "..."
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
  const quoteId = Number(e.target.getAttribute("data-id"));
  if (confirm("Are you sure you want to delete this quote?")) {
    quotes = quotes.filter((quote) => quote.id !== quoteId);
    saveQuotes();
    renderQuotes();
  }
}

function editQuote(e) {
  const quoteId = Number(e.target.getAttribute("data-id"));
  const quoteToEdit = quotes.find((q) => q.id === quoteId);

  if (!quoteToEdit) {
    alert("Quote not found.");
    return;
  }

  // Populate form
  document.getElementById("quoteText").value = quoteToEdit.quoteText;
  document.getElementById("bookTitle").value = quoteToEdit.bookTitle;
  document.getElementById("authorName").value = quoteToEdit.authorName;

  // Remove original
  quotes = quotes.filter((q) => q.id !== quoteId);
  saveQuotes();
  renderQuotes();
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

  // Count quotes by author
  const authorsMap = quotes.reduce((acc, quote) => {
    const author = quote.authorName.trim();
    if (author) {
      acc[author] = (acc[author] || 0) + 1;
    }
    return acc;
  }, {});

  // Sort authors by name
  const sortedAuthors = Object.keys(authorsMap).sort();

  sortedAuthors.forEach((authorName) => {
    const count = authorsMap[authorName];

    const card = document.createElement("div");
    card.classList.add("author-card");

    card.innerHTML = `
      <h3>${authorName}</h3>
      <p>${count} ${count === 1 ? "quote" : "quotes"}</p>
    `;

    authorsList.appendChild(card);
  });
}

/* ---------------
   On Page Load
----------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Show main menu by default
  showMainMenu();
});
