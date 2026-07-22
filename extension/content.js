// content.js
// Heuristic job scraper for HireIQ Job Clipper
// Runs in the context of the active web page.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_JOB") {
    try {
      const jobData = extractJobData();
      sendResponse({ success: true, data: jobData });
    } catch (err) {
      console.error("HireIQ Clipper Error:", err);
      sendResponse({ success: false, error: err.message });
    }
  }
  return true; // Keep message channel open for async response if needed
});

function extractJobData() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  let data = null;

  // Layer 1: Site-Specific Parsers (The Sniper)
  if (hostname.includes("linkedin.com")) {
    data = parseLinkedIn();
  } else if (hostname.includes("indeed.com")) {
    data = parseIndeed();
  } else if (hostname.includes("glassdoor.com")) {
    data = parseGlassdoor();
  }

  // Layer 2 & 3: Heuristic Fallbacks if site-specific didn't run or failed to find anything
  if (!data || (!data.role && !data.company)) {
    data = parseGeneric();
  }

  // Ensure URL is always captured
  if (data) {
    data.jdUrl = url;
  }

  return data;
}

// --- SITE SPECIFIC PARSERS ---

function parseLinkedIn() {
  // LinkedIn Job Detail View (either full page or split view)
  const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title, .topcard__title, h1, .t-24");
  
  // LinkedIn uses many different classes for the company name depending on if you are logged in or out
  const companyEl = document.querySelector(
    ".job-details-jobs-unified-top-card__company-name, " +
    ".job-details-jobs-unified-top-card__primary-description a, " +
    ".topcard__org-name-link, " +
    ".topcard__flavor--black-link"
  );
  
  const descEl = document.querySelector("#job-details, .description__text, .jobs-description__content");

  console.log("HireIQ LinkedIn Scraper found:", {
    titleEl, companyEl, descEl
  });

  return {
    role: titleEl ? titleEl.innerText.trim() : "",
    company: companyEl ? companyEl.innerText.trim() : "",
    jdText: descEl ? descEl.innerText.trim() : ""
  };
}

function parseIndeed() {
  const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title");
  const companyEl = document.querySelector('div[data-company-name="true"]');
  const descEl = document.querySelector("#jobDescriptionText");

  return {
    role: titleEl ? titleEl.innerText.replace(/- job post/i, '').trim() : "",
    company: companyEl ? companyEl.innerText.trim() : "",
    jdText: descEl ? descEl.innerText.trim() : ""
  };
}

function parseGlassdoor() {
  const titleEl = document.querySelector(".JobDetails_jobTitle__uIn_V, [data-test='job-title']");
  const companyEl = document.querySelector(".EmployerProfile_employerName__e5KxI, [data-test='employer-name']");
  const descEl = document.querySelector(".JobDetails_jobDescription__uW_fK, .jobDescriptionContent");

  // Glassdoor company name often has the rating appended (e.g., "Google4.5★")
  let companyName = companyEl ? companyEl.innerText.trim() : "";
  companyName = companyName.replace(/[\d.]+★$/, '');

  return {
    role: titleEl ? titleEl.innerText.trim() : "",
    company: companyName,
    jdText: descEl ? descEl.innerText.trim() : ""
  };
}

// --- HEURISTIC FALLBACK (Generic Parser) ---

function parseGeneric() {
  let role = "";
  let company = "";
  let jdText = "";

  // 1. Look for Schema.org JobPosting in JSON-LD
  // Many career sites (Workday, Greenhouse, Lever, etc.) embed this for Google Jobs SEO
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.innerText);
      // Sometimes it's an array of objects
      const items = Array.isArray(json) ? json : [json];
      
      for (const item of items) {
        if (item["@type"] === "JobPosting") {
          role = item.title || "";
          
          if (item.hiringOrganization) {
            company = item.hiringOrganization.name || "";
          }

          if (item.description) {
            // Strip HTML from description if it's rich text
            const tmp = document.createElement("div");
            tmp.innerHTML = item.description;
            jdText = tmp.innerText;
          }
          
          if (role && company) return { role, company, jdText };
        }
      }
    } catch (e) {
      // Ignore JSON parse errors and continue
    }
  }

  // 2. If no JobPosting schema, use OpenGraph meta tags
  if (!role) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      const titleParts = ogTitle.content.split(/[-|]/).map(s => s.trim());
      // e.g., "Software Engineer - Stripe"
      if (titleParts.length >= 2) {
        role = titleParts[0];
        company = titleParts[1];
      } else {
        role = ogTitle.content;
      }
    }
  }

  // 3. Fallback for Role: The document title
  if (!role) {
    const docTitle = document.title;
    const titleParts = docTitle.split(/[-|]/).map(s => s.trim());
    if (titleParts.length >= 2) {
      role = titleParts[0];
      // Often the company is the last part of the title
      if (!company) company = titleParts[titleParts.length - 1];
    } else {
      role = docTitle;
    }
  }

  // 4. Absolute Fallback for Role: The main <h1> tag on the page
  // On almost every ATS (Greenhouse, Lever, Amazon, Google), the job title is the only H1
  if (!role || role.length > 60) { 
    const h1 = document.querySelector("h1");
    if (h1 && h1.innerText) {
      role = h1.innerText.trim();
    }
  }

  // 5. Absolute Fallback for Company: The Domain Name
  // If we are on careers.google.com, the company is probably "Google"
  if (!company) {
    const hostname = window.location.hostname;
    // Strip www., careers., jobs., etc.
    const parts = hostname.replace(/^(www\.|careers\.|jobs\.|jobs\.)/, "").split(".");
    if (parts.length > 0) {
      // Capitalize first letter of the domain name (e.g., "google" -> "Google")
      company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  }

  // 6. Fallback for description (just grab main body text, rough heuristic)
  if (!jdText) {
    const mainEl = document.querySelector("main, #main, article, .job-description, .description");
    if (mainEl) {
      jdText = mainEl.innerText.substring(0, 5000); // cap at 5k chars to avoid crashing
    }
  }

  return { role, company, jdText };
}
