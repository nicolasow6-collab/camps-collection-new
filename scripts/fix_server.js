const fs = require('fs');

let content = fs.readFileSync('server.js', 'utf8');

if (!content.includes("fs.mkdirSync('public/uploads'")) {
  // Add mkdirSync after const app = express();
  content = content.replace(
    'const app = express();',
    `const app = express();\n\nif (!fs.existsSync('public/uploads')) {\n  fs.mkdirSync('public/uploads', { recursive: true });\n}`
  );
  
  // Also add an error handler for /api routes
  const errHandler = `
// Catch API errors and return JSON instead of HTML
app.use('/api', (err, req, res, next) => {
  if (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  } else {
    next();
  }
});

// Fallback to React app
app.get('*', (req, res) => {`;
  
  content = content.replace(`// Fallback to React app\napp.get('*', (req, res) => {`, errHandler);
  
  fs.writeFileSync('server.js', content);
  console.log('Fixed server.js');
} else {
  console.log('Already fixed');
}
