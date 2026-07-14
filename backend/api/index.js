// Vercel serverless entry point.
// Vercel treats every file in /api as its own serverless function.
// This single file re-exports the whole Express app, so every request
// (thanks to the rewrite rule in vercel.json) is handled by one function.
module.exports = require('../server');
