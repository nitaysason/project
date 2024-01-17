const baseUrl = 'http://localhost:5000'; // Update with your Flask app URL
let authToken = null;

function setAuthToken(token) {
    authToken = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('bookSection').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('bookSection').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    axios.post(`${baseUrl}/login`, { username, password })
        .then(response => {
            const { access_token } = response.data;
            setAuthToken(access_token);
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

function showBookSection() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('bookSection').style.display = 'block';
}

function fetchBooks() {
    axios.get(`${baseUrl}/books`)
        .then(response => {
            const bookList = document.getElementById('bookList');
            bookList.innerHTML = '';

            response.data.forEach(book => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>ID:</strong> ${book.id} |
                    <strong>Title:</strong> ${book.title} |
                    <strong>Author:</strong> ${book.author} |
                    <button onclick="updateBook(${book.id})">Update</button> |
                    <button onclick="deleteBook(${book.id})">Delete</button>
                `;
                bookList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching books:', error.response ? error.response.data.message : error.message);
        });
}

async function addBook() {
    try {
        const titleElement = document.getElementById('title');
        const authorElement = document.getElementById('author');
        const userIdElement = document.getElementById('userId');

        // Check if elements exist
        if (!titleElement || !authorElement) {
            console.error('Title and author elements are required.');
            return;
        }

        const title = titleElement.value;
        const author = authorElement.value;

        // Optional: Check if userId is present and is a number
        const userId = userIdElement ? userIdElement.value : null;
        if (userId !== null && isNaN(userId)) {
            console.error('User ID must be a valid number.');
            return;
        }

        const response = await axios.post(`${baseUrl}/books`, { title, author, user_id: userId });
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
