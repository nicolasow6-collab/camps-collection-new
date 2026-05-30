const fs = require('fs');

const pokemonImages = `
  <!-- Floating Background Elements -->
  <img src="/images/pikachu_voxel.png" class="floating-pokemon pokemon-1" alt="" />
  <img src="/images/charizard_voxel.png" class="floating-pokemon pokemon-2" alt="" />
  <img src="/images/bulbasaur_voxel.png" class="floating-pokemon pokemon-3" alt="" />
  <img src="/images/snorlax_voxel.png" class="floating-pokemon pokemon-4" alt="" />
  <img src="/images/mewtwo_voxel.png" class="floating-pokemon pokemon-5" alt="" />
  
  <img src="/images/charmander_voxel.png" class="floating-pokemon pokemon-6" alt="" />
  <img src="/images/gengar_voxel.png" class="floating-pokemon pokemon-7" alt="" />
  <img src="/images/squirtle_voxel.png" class="floating-pokemon pokemon-8" alt="" />
  <img src="/images/eevee_voxel.png" class="floating-pokemon pokemon-9" alt="" />
  <img src="/images/mew_voxel.png" class="floating-pokemon pokemon-10" alt="" />
`;

const files = ['public/index.html', 'public/vault.html', 'public/admin.html', 'public/login.html', 'public/orders.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove existing floating elements block from body if it exists
  content = content.replace(/<!-- Floating Background Elements -->[\s\S]*?(?=<!-- HEADER|<!--| <header|<main|<div)/, '');
  
  // Clean up any double inserts from earlier regex mistakes
  // Insert the new 10 pokemon images right after <body ...>
  content = content.replace(/(<body[^>]*>)/, `$1\n${pokemonImages}\n`);

  // Fix orders.html <link> bug
  if (file === 'public/orders.html') {
    content = content.replace('  <link rel="stylesheet" href="/global.css">\n  </style>', '  </style>\n  <link rel="stylesheet" href="/global.css">');
  }

  fs.writeFileSync(file, content);
}
console.log('HTML files updated with 10 Pokemon and fixed orders.html');
