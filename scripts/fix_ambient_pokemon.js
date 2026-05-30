const fs = require('fs');

const files = [
  'public/admin.html',
  'public/orders.html',
  'public/vault.html',
  'public/login.html',
  'public/checkout.html'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix Squirtle
    content = content.replace(
      'class="absolute top-72 -right-10 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_7s_ease-in-out_infinite] z-0"',
      'class="absolute top-72 right-0 md:-right-10 w-24 md:w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_7s_ease-in-out_infinite] z-0"'
    );
    
    // Fix Mew
    content = content.replace(
      'class="absolute top-32 left-0 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-0"',
      'class="absolute top-32 left-0 w-24 md:w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-0"'
    );
    
    // Fix Bulbasaur
    content = content.replace(
      'class="absolute bottom-32 -left-5 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0"',
      'class="absolute bottom-32 left-0 md:-left-5 w-24 md:w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0"'
    );

    // Fix Togepi
    content = content.replace(
      'class="absolute bottom-10 right-10 w-24 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0"',
      'class="absolute bottom-10 right-0 md:right-10 w-16 md:w-24 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0"'
    );

    // Fix Pikachu (login / admin)
    content = content.replace(
      'class="absolute top-20 -right-10 w-40 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0"',
      'class="absolute top-20 right-0 md:-right-10 w-24 md:w-40 opacity-15 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-0"'
    );
    
    // Fix Charizard (login / admin)
    content = content.replace(
      'class="absolute bottom-10 -right-20 w-64 opacity-15 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-0"',
      'class="absolute bottom-10 right-0 md:-right-20 w-32 md:w-64 opacity-15 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-0"'
    );
    
    // Fix Gengar (login / admin)
    content = content.replace(
      'class="absolute top-1/3 -left-10 w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_9s_ease-in-out_infinite] z-0"',
      'class="absolute top-1/3 left-0 md:-left-10 w-24 md:w-48 opacity-15 mix-blend-multiply pointer-events-none animate-[float_9s_ease-in-out_infinite] z-0"'
    );

    // Fix Eevee (login / admin)
    content = content.replace(
      'class="absolute bottom-32 left-10 w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0"',
      'class="absolute bottom-32 left-0 md:left-10 w-24 md:w-32 opacity-15 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-0"'
    );

    fs.writeFileSync(file, content);
  }
}
console.log('Mobile ambient pokemon offsets fixed.');
