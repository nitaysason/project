const baseUrl = 'http://localhost:5000'; // Update with your Flask app URL
let authToken = null;
let isLibrarian = false;

function setAuthToken(token, librarianStatus) {
    authToken = token;
    isLibrarian = librarianStatus;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('bookSection').style.display = 'none';
    document.getElementById('userActions').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('bookSection').style.display = 'none';
    document.getElementById('userActions').style.display = 'none';
}

function showBookSection() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('bookSection').style.display = 'block';

    const userActions = document.getElementById('userActions');
    const addBookForm = document.getElementById('addBookForm');
    const bookList = document.getElementById('bookList');

    if (isLibrarian) {
        userActions.style.display = 'none';
        addBookForm.style.display = 'block';
    } else {
        userActions.style.display = 'block';
        addBookForm.style.display = 'none';
    }

    // Fetch and display books for all users
    fetchBooks();
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    axios.post(`${baseUrl}/login`, { username, password })
        .then(response => {
            const { access_token, is_librarian } = response.data;
            setAuthToken(access_token, is_librarian);
            showBookSection();
            fetchBooks();
        })
        .catch(error => {
            console.error('Login failed:', error.response ? error.response.data.message : error.message);
        });
}

async function register() {
    try {
        const regUsername = document.getElementById('regUsername').value;
        const regPassword = document.getElementById('regPassword').value;

        const response = await axios.post(`${baseUrl}/register`, { username: regUsername, password: regPassword });
        console.log(response.data.message);
        showLoginForm();
    } catch (error) {
        console.error('Registration failed:', error.response ? error.response.data.message : error.message);
    }
}

async function fetchBooks() {
    try {
        const response = await axios.get(`${baseUrl}/books`);
        const bookList = document.getElementById('bookList');
        bookList.innerHTML = '';

        response.data.forEach(book => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>ID:</strong> ${book.id} |
                <strong>Title:</strong> ${book.title} |
                <strong>Author:</strong> ${book.author} |
                ${isLibrarian ? '<button class="update-button" onclick="updateBook(' + book.id + ')">Update</button>' : ''} |
                ${isLibrarian ? '<button class="delete-button" onclick="deleteBook(' + book.id + ')">Delete</button>' : ''}
                ${!isLibrarian ? '<button class="take-button" onclick="takeBook(' + book.id + ')">Take Book</button>' : ''}
                ${!isLibrarian ? '<button class="return-button" onclick="returnBook(' + book.id + ')">Return Book</button>' : ''}
            `;
            bookList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching books:', error.response ? error.response.data.message : error.message);
    }
}


async function addBook() {
    try {
        const titleElement = document.getElementById('title');
        const authorElement = document.getElementById('author');

        if (!titleElement || !authorElement) {
            console.error('Title and author elements are required.');
            return;
        }

        const title = titleElement.value;
        const author = authorElement.value;

        const response = await axios.post(`${baseUrl}/books`, { title, author });
        console.log(response.data.message);
        fetchBooks();
    } catch (error) {
        console.error('Error adding book:', error.response ? error.response.data.message : error.message);
    }
}

function updateBook(bookId) {
    const newTitle = prompt('Enter new title:');
    const newAuthor = prompt('Enter new author:');

    axios.put(`${baseUrl}/books/${bookId}`, { title: newTitle, author: newAuthor })
        .then(response => {
            console.log(response.data.message);
            fetchBooks();
        })
        .catch(error => {
            console.error('Error updating book:', error.response ? error.response.data.message : error.message);
        });
}

function deleteBook(bookId) {
    const confirmDelete = confirm('Are you sure you want to delete this book?');
    if (confirmDelete) {
        axios.delete(`${baseUrl}/books/${bookId}`)
            .then(response => {
                console.log(response.data.message);
                fetchBooks();
            })
            .catch(error => {
                console.error('Error deleting book:', error.response ? error.response.data.message : error.message);
            });
    }
}

// JavaScript for taking a book
function takeBook(bookId) {
    axios.post(`${baseUrl}/take_book/${bookId}`)
        .then(response => {
            console.log(response.data.message);
            fetchBooks();
        })
        .catch(error => {
            console.error('Error taking book:', error.response ? error.response.data.message : error.message);
            alert('book alredy taken');
        });
}

// JavaScript for returning a book
function returnBook(bookId) {
    axios.post(`${baseUrl}/return_book/${bookId}`)
        .then(response => {
            console.log(response.data.message);
            fetchBooks();
        })
        .catch(error => {
            console.error('Error returning book:', error.response ? error.response.data.message : error.message);
            alert('You dont have the book');
        });
}

// Attach event listeners to the forms
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    login();
});

document.getElementById('registrationForm').addEventListener('submit', function (event) {
    event.preventDefault();
    register();
});

document.getElementById('addBookForm').addEventListener('submit', function (event) {
    event.preventDefault();
    addBook();
});

// Fetch and display books on page load if authenticated
if (authToken) {
    showBookSection();
    fetchBooks();
} else {
    showLoginForm();
}