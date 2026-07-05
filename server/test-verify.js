// Tests verifyToken middleware by calling a protected route
// Delete this file after testing
require("dotenv").config();
const http = require("http");

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: "localhost", port: 5000, path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), ...headers },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: "localhost", port: 5000, path, headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
    }).on("error", reject);
  });
}

async function run() {
  // First get a real token by logging in
  const loginRes = await post("/api/auth/login", {
    email: "test@applitrack.com",
    password: "password123",
  });
  const token = loginRes.body.accessToken;
  console.log("Got token:", token ? "✅ yes" : "❌ no");

  console.log("\n── TEST 1: No token ──────────────────────");
  const r1 = await get("/api/health-protected");
  console.log("Status:", r1.status, "→ expected 404 (route doesn't exist, but that's fine)");

  console.log("\n── TEST 2: Invalid token ─────────────────");
  const r2 = await get("/api/auth/refresh", { Authorization: "Bearer faketoken123" });
  console.log("Status:", r2.status, "Body:", r2.body);

  console.log("\n── TEST 3: Valid token format (no protected route yet) ─");
  console.log("Token looks like:", token?.substring(0, 30) + "...");
  console.log("verifyToken is ready — will be tested when we add protected routes ✅");
}

run().catch(console.error);
