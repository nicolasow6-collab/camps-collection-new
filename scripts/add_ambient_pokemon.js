const fs = require('fs');

const pokemonConfigs = {
  'public/admin.html': `
  <img src="/images/charizard_voxel.png" class="fixed bottom-10 right-10 w-48 opacity-20 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/gengar_voxel.png" class="fixed top-32 right-10 w-40 opacity-20 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/orders.html': `
  <img src="/images/mew_pointing.png" class="fixed bottom-10 left-10 w-32 opacity-25 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/squirtle_pointing.png" class="fixed bottom-10 right-10 w-32 opacity-25 mix-blend-multiply pointer-events-none animate-[float_7s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/vault.html': `
  <img src="/images/snorlax_voxel.png" class="fixed bottom-10 right-10 w-48 opacity-25 mix-blend-multiply pointer-events-none animate-[float_12s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/bulbasaur_voxel.png" class="fixed bottom-10 left-10 w-32 opacity-25 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/login.html': `
  <img src="/images/pikachu_voxel.png" class="fixed bottom-10 right-10 w-40 opacity-25 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/togepi_peeking.png" class="fixed bottom-10 left-10 w-24 opacity-25 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-50" style="filter: contrast(1.1) brightness(1.05);" alt="">`
};

for (const [file, htmlToAdd] of Object.entries(pokemonConfigs)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(<body[^>]*>)/, `$1\n${htmlToAdd}\n`);
  fs.writeFileSync(file, content);
}

console.log('Ambient pokemon added to all pages!');
