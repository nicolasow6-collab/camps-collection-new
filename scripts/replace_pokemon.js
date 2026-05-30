const fs = require('fs');

const morePokemon = {
  'public/admin.html': `
  <img src="/images/charizard_voxel.png" class="absolute top-40 -left-10 w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/gengar_voxel.png" class="absolute top-96 right-0 w-40 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/pikachu_voxel.png" class="absolute bottom-40 left-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_9s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/snorlax_voxel.png" class="absolute bottom-10 -right-10 w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_12s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/orders.html': `
  <img src="/images/mew_pointing.png" class="absolute top-32 left-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/squirtle_pointing.png" class="absolute top-72 -right-10 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_7s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/bulbasaur_voxel.png" class="absolute bottom-32 -left-5 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/togepi_peeking.png" class="absolute bottom-10 right-10 w-24 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/vault.html': `
  <img src="/images/snorlax_voxel.png" class="absolute top-40 right-0 w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_12s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/bulbasaur_voxel.png" class="absolute top-96 left-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/mew_pointing.png" class="absolute bottom-60 right-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/eevee_voxel.png" class="absolute bottom-20 left-0 w-24 opacity-15 mix-blend-multiply pointer-events-none animate-[float_7s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">`,
  
  'public/login.html': `
  <img src="/images/pikachu_voxel.png" class="absolute top-10 right-0 w-40 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/togepi_peeking.png" class="absolute bottom-10 left-10 w-24 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/charizard_voxel.png" class="absolute bottom-0 -right-10 w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">
  <img src="/images/gengar_voxel.png" class="absolute top-40 left-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_9s_ease-in-out_infinite] z-0" style="filter: contrast(1.1) brightness(1.05);" alt="">`
};

for (const [file, htmlToAdd] of Object.entries(morePokemon)) {
  let content = fs.readFileSync(file, 'utf8');
  // Remove the old fixed pokemon
  content = content.replace(/\s*<img src="\/images\/[^"]+" class="fixed[^>]*>\n?\s*<img src="\/images\/[^"]+" class="fixed[^>]*>/, '');
  // Insert new absolute pokemon
  content = content.replace(/(<body[^>]*>)/, `$1\n${htmlToAdd}\n`);
  fs.writeFileSync(file, content);
}

console.log('Replaced fixed with many absolute pokemon!');
