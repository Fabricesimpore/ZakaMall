// Simple script to create categories via curl
const categories = [
  { name: "Électronique", description: "Téléphones, ordinateurs, accessoires électroniques", slug: "electronique" },
  { name: "Mode & Vêtements", description: "Vêtements, chaussures, accessoires de mode", slug: "mode-vetements" },
  { name: "Maison & Jardin", description: "Meubles, décoration, jardinage", slug: "maison-jardin" },
  { name: "Beauté & Santé", description: "Cosmétiques, produits de santé, bien-être", slug: "beaute-sante" },
  { name: "Sports & Loisirs", description: "Équipements sportifs, jeux, loisirs", slug: "sports-loisirs" },
  { name: "Livres & Médias", description: "Livres, musique, films, jeux vidéo", slug: "livres-medias" },
  { name: "Alimentation", description: "Produits alimentaires, boissons", slug: "alimentation" },
  { name: "Automobile", description: "Pièces auto, accessoires véhicules", slug: "automobile" }
];

console.log("Categories to create:");
categories.forEach((cat, index) => {
  console.log(`${index + 1}. ${cat.name} (${cat.slug})`);
});

console.log("\nTo create these categories, run the following commands after logging in as admin:");
console.log("Or use the browser developer console on the admin dashboard page:");

console.log(`
// Copy this code to browser console on admin dashboard:
const categories = ${JSON.stringify(categories, null, 2)};

async function createCategories() {
  for (const category of categories) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
      });
      
      if (response.ok) {
        console.log('✅ Created:', category.name);
      } else {
        console.log('❌ Failed:', category.name, await response.text());
      }
    } catch (error) {
      console.log('❌ Error:', category.name, error.message);
    }
  }
}

createCategories();
`);