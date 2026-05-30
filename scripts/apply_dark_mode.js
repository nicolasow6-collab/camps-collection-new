const fs = require('fs');
const path = require('path');

const dir = 'public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const tailwindConfigReplace = `
  <script>
    tailwind.config = {
      darkMode: 'class',
`;

const foucScript = `
  <script>
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  </script>
</head>`;

const gengarSwitchHtml = `
  <!-- Gengar Dark Mode Switch -->
  <button id="theme-toggle" class="fixed bottom-6 left-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[100] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none">
    <img id="theme-toggle-light-icon" src="/images/gengar_sleeping.png" class="w-10 h-10 hidden" alt="Light Mode">
    <img id="theme-toggle-dark-icon" src="/images/gengar_awake.png" class="w-10 h-10 hidden" alt="Dark Mode">
  </button>
  
  <script>
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (document.documentElement.classList.contains('dark')) {
        themeToggleDarkIcon.classList.remove('hidden');
    } else {
        themeToggleLightIcon.classList.remove('hidden');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');

    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });
  </script>
</body>`;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add darkMode: 'class'
  content = content.replace(/<\s*script\s*>\s*tailwind\.config\s*=\s*\{/, tailwindConfigReplace.trim());

  // 2. Add FOUC script before </head>
  if (!content.includes('color-theme')) {
      content = content.replace('</head>', foucScript);
  }

  // 3. Update <body> tag for dark mode background
  content = content.replace(/<body class="([^"]*)"/g, (match, p1) => {
      if (!p1.includes('dark:bg-zinc-900')) {
          return `<body class="${p1} dark:bg-zinc-900 dark:text-zinc-100 transition-colors duration-500"`;
      }
      return match;
  });

  // 4. Remove hardcoded body background from <style>
  content = content.replace(/background-color:\s*#fafafa;/g, '');

  // 5. Replace utility classes for dark mode
  const replacements = [
    { from: /\bbg-white\b(?! dark:bg-zinc-800)/g, to: 'bg-white dark:bg-zinc-800' },
    { from: /\bbg-zinc-50\b(?! dark:bg-zinc-900\/50)/g, to: 'bg-zinc-50 dark:bg-zinc-900/50' },
    { from: /\btext-zinc-900\b(?! dark:text-zinc-100)/g, to: 'text-zinc-900 dark:text-zinc-100' },
    { from: /\btext-zinc-800\b(?! dark:text-zinc-200)/g, to: 'text-zinc-800 dark:text-zinc-200' },
    { from: /\btext-zinc-600\b(?! dark:text-zinc-400)/g, to: 'text-zinc-600 dark:text-zinc-400' },
    { from: /\btext-zinc-500\b(?! dark:text-zinc-400)/g, to: 'text-zinc-500 dark:text-zinc-400' },
    { from: /\btext-zinc-400\b(?! dark:text-zinc-500)/g, to: 'text-zinc-400 dark:text-zinc-500' }, // swap
    { from: /\bborder-zinc-200\b(?! dark:border-zinc-700)/g, to: 'border-zinc-200 dark:border-zinc-700' },
    { from: /\bborder-zinc-100\b(?! dark:border-zinc-700\/50)/g, to: 'border-zinc-100 dark:border-zinc-700/50' },
    { from: /\bbg-white\/80\b(?! dark:bg-zinc-900\/80)/g, to: 'bg-white/80 dark:bg-zinc-900/80' },
    { from: /\bbg-white\/90\b(?! dark:bg-zinc-900\/90)/g, to: 'bg-white/90 dark:bg-zinc-900/90' },
  ];

  for (const {from, to} of replacements) {
    content = content.replace(from, to);
  }
  
  // 6. Inject Gengar Switch before </body>
  if (!content.includes('Gengar Dark Mode Switch')) {
      content = content.replace('</body>', gengarSwitchHtml);
  }

  // 7. Add vanilla-tilt script
  if (!content.includes('vanilla-tilt.min.js')) {
      content = content.replace('</head>', '  <script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js"></script>\n</head>');
  }

  fs.writeFileSync(filePath, content);
}
console.log('Dark mode and Vanilla Tilt applied to all HTML files.');
