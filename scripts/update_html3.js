const fs = require('fs');

const newPokemonDOM = `
  <!-- Floating Background Elements Container -->
  <div class="pokemon-bg-container">
    <img src="/images/pikachu_voxel.png" class="floating-pokemon poke-pos-1" alt="" />
    <img src="/images/charizard_voxel.png" class="floating-pokemon poke-pos-2" alt="" />
    <img src="/images/bulbasaur_voxel.png" class="floating-pokemon poke-pos-3" alt="" />
    <img src="/images/snorlax_voxel.png" class="floating-pokemon poke-pos-4" alt="" />
    <img src="/images/mewtwo_voxel.png" class="floating-pokemon poke-pos-5" alt="" />
    
    <img src="/images/charmander_voxel.png" class="floating-pokemon poke-pos-6" alt="" />
    <img src="/images/gengar_voxel.png" class="floating-pokemon poke-pos-7" alt="" />
    <img src="/images/squirtle_voxel.png" class="floating-pokemon poke-pos-8" alt="" />
    <img src="/images/eevee_voxel.png" class="floating-pokemon poke-pos-9" alt="" />
    <img src="/images/mew_voxel.png" class="floating-pokemon poke-pos-10" alt="" />
    
    <img src="/images/pikachu_voxel.png" class="floating-pokemon poke-pos-11" alt="" />
    <img src="/images/charizard_voxel.png" class="floating-pokemon poke-pos-12" alt="" />
  </div>
`;

const files = ['public/index.html', 'public/vault.html', 'public/admin.html', 'public/login.html', 'public/orders.html'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove existing raw img tags that were floating-pokemon
  content = content.replace(/<!-- Floating Background Elements -->[\s\S]*?(?=<!-- HEADER|<!--| <header|<main|<div)/, '');
  
  // Ensure body has position: relative (if it doesn't already have it)
  // Our style tags might have it, but let's be safe.
  
  // Insert the new container right after <body ...>
  content = content.replace(/(<body[^>]*>)/, `$1\n${newPokemonDOM}\n`);

  fs.writeFileSync(file, content);
}
console.log('HTML files updated with containerized Pokemon spread vertically');
