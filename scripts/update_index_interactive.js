const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove the global container
html = html.replace(/<!-- Floating Background Elements Container -->[\s\S]*?<div class="pokemon-bg-container">.*?<\/div>/s, '');

// 2. Add Mew pointing to Live Orders
const liveOrdersTarget = `<h2 class="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">`;
const liveOrdersReplacement = `<h2 class="relative text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
          <img src="/images/mew_pointing.png" alt="Mew" class="absolute -top-12 -left-28 w-24 opacity-80 mix-blend-multiply animate-[float_6s_ease-in-out_infinite] hidden md:block z-20" style="filter: contrast(1.1) brightness(1.05);">`;
html = html.replace(liveOrdersTarget, liveOrdersReplacement);

// 3. Add Peeking Togepi to Recent Orders
const recentOrdersTarget = `<h2 class="text-3xl font-bold tracking-tight text-zinc-900 mb-8">Recent Orders</h2>`;
const recentOrdersReplacement = `<div class="relative inline-block w-full">
        <h2 class="text-3xl font-bold tracking-tight text-zinc-900 mb-8 inline-block relative">
          Recent Orders
          <img src="/images/togepi_peeking.png" alt="Togepi" class="absolute -top-16 -right-20 w-20 opacity-90 mix-blend-multiply animate-[bounce_4s_infinite] hidden md:block z-20" style="filter: contrast(1.1) brightness(1.05);">
        </h2>
      </div>`;
html = html.replace(recentOrdersTarget, recentOrdersReplacement);

// 4. Add Squirtle and logic to FAQ
const faqListTarget = `<div id="faq-list" class="divide-y divide-zinc-200 border-t border-zinc-200">`;
const faqListReplacement = `<div id="faq-list" class="divide-y divide-zinc-200 border-t border-zinc-200 relative">
        <!-- Interactive Squirtle -->
        <img id="faq-squirtle" src="/images/squirtle_pointing.png" alt="Squirtle" class="absolute -left-24 w-24 mix-blend-multiply transition-all duration-300 pointer-events-none hidden md:block z-20" style="top: 20px; opacity: 0; filter: contrast(1.1) brightness(1.05);">
`;
html = html.replace(faqListTarget, faqListReplacement);

const scriptTarget = `</body>`;
const scriptReplacement = `
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const faqList = document.getElementById('faq-list');
      const squirtle = document.getElementById('faq-squirtle');
      if (faqList && squirtle) {
        const buttons = faqList.querySelectorAll('button');
        faqList.addEventListener('mouseleave', () => {
          squirtle.style.opacity = '0';
        });
        buttons.forEach((btn) => {
          btn.addEventListener('mouseenter', () => {
            squirtle.style.opacity = '0.9';
            squirtle.style.top = (btn.offsetTop + 10) + 'px';
          });
        });
      }
    });
  </script>
</body>`;
html = html.replace(scriptTarget, scriptReplacement);

// 5. Scatter general Pokemon safely inside sections with relative wrappers
const heroTarget = `<!-- Hero Section: Premium, Minimalist -->`;
const heroReplacement = `<!-- Hero Section: Premium, Minimalist -->
  <div class="absolute top-20 left-[10%] hidden md:block"><img src="/images/pikachu_voxel.png" class="w-40 opacity-30 mix-blend-multiply animate-[float_8s_ease-in-out_infinite]" style="filter: contrast(1.1) brightness(1.05);" alt=""></div>
  <div class="absolute top-1/3 right-[5%] hidden md:block"><img src="/images/snorlax_voxel.png" class="w-48 opacity-30 mix-blend-multiply animate-[float_12s_ease-in-out_infinite]" style="filter: contrast(1.1) brightness(1.05);" alt=""></div>
`;
html = html.replace(heroTarget, heroReplacement);

const galleryTarget = `<!-- Gallery Section: Sourced from Japan -->
  <section id="gallery" class="bg-white">`;
const galleryReplacement = `<!-- Gallery Section: Sourced from Japan -->
  <section id="gallery" class="bg-white relative">
    <div class="absolute top-10 right-[5%] hidden md:block"><img src="/images/charizard_voxel.png" class="w-56 opacity-25 mix-blend-multiply animate-[float_10s_ease-in-out_infinite]" style="filter: contrast(1.1) brightness(1.05);" alt=""></div>
    <div class="absolute bottom-20 left-[5%] hidden md:block"><img src="/images/gengar_voxel.png" class="w-40 opacity-25 mix-blend-multiply animate-[float_9s_ease-in-out_infinite]" style="filter: contrast(1.1) brightness(1.05);" alt=""></div>
`;
html = html.replace(galleryTarget, galleryReplacement);

fs.writeFileSync('public/index.html', html);
console.log('index.html updated with interactive Pokemon!');
