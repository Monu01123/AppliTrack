// src/routes/public.js
//
// Unauthenticated public route for shareable candidate showcase profiles.

const express = require("express");
const router = express.Router();
const { getPublicProfile } = require("../controllers/public.controller");

router.get("/profile/:slugOrId", getPublicProfile);

module.exports = router;
