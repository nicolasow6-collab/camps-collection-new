const fs = require('fs');

const pokemonImages = `
  <!-- Floating Background Elements -->
  <img src="/images/pikachu_voxel.png" class="floating-pokemon pokemon-1" alt="" />
  <img src="/images/charizard_voxel.png" class="floating-pokemon pokemon-2" alt="" />
  <img src="/images/charmander_voxel.png" class="floating-pokemon pokemon-3" alt="" />
  <img src="/images/mewtwo_voxel.png" class="floating-pokemon pokemon-4" alt="" />
  <img src="/images/gengar_voxel.png" class="floating-pokemon pokemon-5" alt="" />
  <img src="/images/snorlax_voxel.png" class="floating-pokemon pokemon-6" alt="" />
`;

const files = ['public/index.html', 'public/vault.html', 'public/admin.html', 'public/login.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('global.css')) {
    content = content.replace('</head>', '  <link rel="stylesheet" href="/global.css">\n</head>');
  }
  if (!content.includes('floating-pokemon')) {
    content = content.replace(/(<body[^>]*>)/, `$1\n${pokemonImages}`);
  }
  fs.writeFileSync(file, content);
}
console.log('HTML files updated with Pokemon and global.css');
