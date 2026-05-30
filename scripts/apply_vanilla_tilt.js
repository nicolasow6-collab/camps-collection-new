const fs = require('fs');

const files = ['public/index.html', 'public/vault.html'];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add data-tilt attributes to the card template (in case it wasn't added properly)
    content = content.replace(/<div class="card-hover bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 transition-all duration-500 card-enter group"/g, 
      '<div class="card-hover bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 transition-all duration-500 card-enter group"');

    // The insertion logic
    const initTiltStr = `
      setTimeout(() => {
        if(typeof VanillaTilt !== 'undefined') {
          VanillaTilt.init(document.querySelectorAll(".card-hover"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.35,
            scale: 1.02
          });
        }
      }, 50);
    }
`;
    
    // Replace the closing brace of renderCardGrid with the init logic
    // We look for:
    //       `).join('');
    //     }
    content = content.replace(/(\.join\(''\);\s*)\}/g, `$1${initTiltStr}`);
    
    fs.writeFileSync(file, content);
  }
}
console.log('Fixed vanilla tilt logic.');
