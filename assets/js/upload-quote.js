import { API_DOMAIN } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = await checkLoginStatus();

  if (isLoggedIn) {
    document.getElementById('post-form').classList.remove('hidden');
  } else {
    document.getElementById('login-message').classList.remove('hidden');
  }
});

document.getElementById('post-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const content = document.getElementById('content').value.trim(); // Trim whitespace
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');
  const errorText = document.getElementById('error-text');
  
  // Reset messages
  errorMessage.classList.add('hidden');
  successMessage.classList.add('hidden');

  if (!content) {
    errorText.textContent = 'Content cannot be empty.';
    errorMessage.classList.remove('hidden');
    return;
  }

  const jwt = getJWTFromCookies();
  if (!jwt) {
    errorText.textContent = 'You are not logged in.';
    errorMessage.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch(`${API_DOMAIN}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${jwt}`, // Include token with Bearer
      },
      body: JSON.stringify({ text: content }),
    });
    console.log("jwt", jwt)
    const data = await response.json();

    if (data.error) {
      // Handle error response
      console.error('Error Response:', data);
      const errorMessageText = data.error || 'Failed to create the post. Please try again.';
      errorText.textContent = errorMessageText;
      errorMessage.classList.remove('hidden');
    } else {
      // Handle success response
      console.log('Created Post:', data);
      successMessage.classList.remove('hidden');
      setTimeout(() => {
        window.location.href = 'quotes.html'; // Redirect after success
      }, 1000); // Delay for better UX
    }
  } catch (error) {
    // Handle network or unexpected errors
    console.error('Network or Unexpected Error:', error);
    errorText.textContent = 'An error occurred while creating the post.';
    errorMessage.classList.remove('hidden');
  }
});

async function checkLoginStatus() {
  const jwt = getJWTFromCookies();
  if (!jwt) return false;

  return validateJWT(jwt); // Validate expiration
}

function getJWTFromCookies() {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('Authorization=')) {
      return cookie.substring('Authorization='.length);
    }
  }
  return null;
}

function validateJWT(jwt) {
  const payload = parseJWT(jwt);
  if (!payload) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime; // Check expiration
}

function parseJWT(jwt) {
  const base64Url = jwt.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const jsonPayload = decodeURIComponent(escape(window.atob(base64)));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}
