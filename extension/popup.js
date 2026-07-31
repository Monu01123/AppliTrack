// popup.js
// Handles authentication and UI state for the Job Clipper extension.

let API_BASE = "https://3.7.237.98.nip.io/api";

document.addEventListener("DOMContentLoaded", async () => {
  const loginView = document.getElementById("login-view");
  const clipperView = document.getElementById("clipper-view");
  const authStatus = document.getElementById("auth-status");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const logoutBtn = document.getElementById("logout-btn");
  const saveBtn = document.getElementById("save-btn");
  const saveError = document.getElementById("save-error");
  const saveSuccess = document.getElementById("save-success");
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const jobPreview = document.getElementById("job-preview");

  const roleInput = document.getElementById("job-role");
  const companyInput = document.getElementById("job-company");
  const jdInput = document.getElementById("job-jd");
  const urlInput = document.getElementById("job-url");

  let currentUser = null;
  let currentToken = null;

  // 1. Load Settings and check if we're already logged in
  const { auth_token, user, custom_api_url } = await chrome.storage.local.get(["auth_token", "user", "custom_api_url"]);
  
  if (custom_api_url) {
    API_BASE = custom_api_url;
  }
  
  if (auth_token && user) {
    setLoggedIn(user, auth_token);
  } else {
    setLoggedOut();
  }

  // Handle Web Login Button
  const webLoginBtn = document.getElementById("web-login-btn");
  if (webLoginBtn) {
    webLoginBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "https://appli-track-seven.vercel.app/auth" });
    });
  }

  // 2. Handle Login Form Submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.classList.add("hidden");
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = document.getElementById("login-btn");
    
    btn.textContent = "Logging in...";
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Required to save the httpOnly refresh token cookie
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      await chrome.storage.local.set({ auth_token: data.accessToken, user: data.user });
      setLoggedIn(data.user, data.accessToken);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove("hidden");
    } finally {
      btn.textContent = "Log In";
      btn.disabled = false;
    }
  });

  // 3. Handle Logout
  logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove(["auth_token", "user"]);
    setLoggedOut();
  });

  // 4. Handle Saving Job
  saveBtn.addEventListener("click", async () => {
    saveError.classList.add("hidden");
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    const role = roleInput.value;
    const company = companyInput.value;
    const jdText = jdInput.value;
    const jdUrl = urlInput.value;

    if (!role || !company) {
      saveError.textContent = "Role and Company are required.";
      saveError.classList.remove("hidden");
      saveBtn.textContent = "Save to Board";
      saveBtn.disabled = false;
      return;
    }

    try {
      let res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          role, company, jdText, jdUrl, status: "APPLIED"
        })
      });

      // Handle Token Expiry
      if (res.status === 401) {
        // Attempt silent refresh
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include"
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          currentToken = refreshData.accessToken;
          await chrome.storage.local.set({ auth_token: currentToken });
          
          // Retry the save request with the new token
          res = await fetch(`${API_BASE}/applications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({ role, company, jdText, jdUrl, status: "APPLIED" })
          });
        } else {
          // If refresh fails, log the user out completely
          await chrome.storage.local.remove(["auth_token", "user"]);
          setLoggedOut();
          throw new Error("Session expired. Please log in again.");
        }
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Success
      jobPreview.classList.add("hidden");
      saveBtn.classList.add("hidden");
      saveSuccess.classList.remove("hidden");
      
      // Auto close after 2 seconds
      setTimeout(() => window.close(), 2000);
    } catch (err) {
      saveError.textContent = err.message;
      saveError.classList.remove("hidden");
      saveBtn.textContent = "Save to Board";
      saveBtn.disabled = false;
    }
  });

  // State Management Helpers
  function setLoggedOut() {
    currentUser = null;
    currentToken = null;
    loginView.classList.remove("hidden");
    clipperView.classList.add("hidden");
    authStatus.textContent = "Logged Out";
    authStatus.className = "auth-status logged-out";
  }

  function setLoggedIn(user, token) {
    currentUser = user;
    currentToken = token;
    loginView.classList.add("hidden");
    clipperView.classList.remove("hidden");
    authStatus.textContent = user.name;
    authStatus.className = "auth-status logged-in";
    
    // As soon as we log in, tell the content script to scrape the page
    scanCurrentPage();
  }

  // Messaging the Content Script
  async function scanCurrentPage() {
    loadingState.classList.remove("hidden");
    jobPreview.classList.add("hidden");
    saveBtn.classList.add("hidden");
    errorState.classList.add("hidden");
    saveSuccess.classList.add("hidden");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error("No active tab");

      // Send a message to content.js asking it to extract job details
      chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_JOB" }, (response) => {
        loadingState.classList.add("hidden");

        if (chrome.runtime.lastError || !response || !response.success) {
          errorState.classList.remove("hidden");
          return;
        }

        // We successfully extracted data!
        jobPreview.classList.remove("hidden");
        saveBtn.classList.remove("hidden");

        roleInput.value = response.data.role || "";
        companyInput.value = response.data.company || "";
        jdInput.value = response.data.jdText || "";
        urlInput.value = response.data.jdUrl || tab.url;

        // If we got a description or URL, reveal their inputs so user can edit them
        if (response.data.jdText) jdInput.parentElement.classList.remove("hidden");
        urlInput.parentElement.classList.remove("hidden");
      });
    } catch (err) {
      loadingState.classList.add("hidden");
      errorState.classList.remove("hidden");
    }
  }
});
