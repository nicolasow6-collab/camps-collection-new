const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');

// Pikachu
content = content.replace(
  'class="absolute top-0 -left-10 w-40 opacity-40 mix-blend-multiply animate-[float_8s_ease-in-out_infinite] hidden md:block z-10"',
  'class="absolute top-0 -left-5 md:-left-10 w-24 md:w-40 opacity-40 mix-blend-multiply pointer-events-none animate-[float_8s_ease-in-out_infinite] z-10"'
);

// Snorlax
content = content.replace(
  'class="absolute top-2/3 left-[40%] w-48 opacity-40 mix-blend-multiply animate-[float_12s_ease-in-out_infinite] hidden md:block z-10"',
  'class="absolute top-2/3 left-[20%] md:left-[40%] w-32 md:w-48 opacity-40 mix-blend-multiply pointer-events-none animate-[float_12s_ease-in-out_infinite] z-10"'
);

// Charizard
content = content.replace(
  'class="absolute top-20 right-0 w-64 opacity-25 mix-blend-multiply animate-[float_10s_ease-in-out_infinite] hidden md:block z-10"',
  'class="absolute top-10 md:top-20 right-0 w-32 md:w-64 opacity-25 mix-blend-multiply pointer-events-none animate-[float_10s_ease-in-out_infinite] z-10"'
);

// Gengar
content = content.replace(
  'class="absolute bottom-40 -left-10 w-48 opacity-25 mix-blend-multiply animate-[float_9s_ease-in-out_infinite] hidden md:block z-10"',
  'class="absolute bottom-40 -left-5 md:-left-10 w-28 md:w-48 opacity-25 mix-blend-multiply pointer-events-none animate-[float_9s_ease-in-out_infinite] z-10"'
);

// Mew
content = content.replace(
  'class="absolute -top-6 -left-28 w-24 opacity-90 mix-blend-multiply animate-[float_6s_ease-in-out_infinite] hidden md:block z-20"',
  'class="absolute -top-10 left-0 md:-left-28 w-16 md:w-24 opacity-90 mix-blend-multiply pointer-events-none animate-[float_6s_ease-in-out_infinite] z-20"'
);

// Togepi
content = content.replace(
  'class="absolute -top-12 -right-24 w-20 opacity-90 mix-blend-multiply animate-[bounce_4s_infinite] hidden md:block z-20"',
  'class="absolute -top-10 right-0 md:-right-24 w-14 md:w-20 opacity-90 mix-blend-multiply pointer-events-none animate-[bounce_4s_infinite] z-20"'
);

// Squirtle
content = content.replace(
  'class="absolute -left-24 w-24 mix-blend-multiply transition-all duration-300 pointer-events-none hidden md:block z-20"',
  'class="absolute -left-5 md:-left-24 w-16 md:w-24 mix-blend-multiply transition-all duration-300 pointer-events-none z-20"'
);

fs.writeFileSync('public/index.html', content);
console.log('Mobile pokemon restored in index.html');
