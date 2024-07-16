async function searchProduct() {
  const input = document.getElementById("productInput").value;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "Suche läuft...";

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${input}?fields=product_name,image_url,nutrition_grades,categories_tags,countries_tags`
    );
    const data = await response.json();

    if (!data.product) {
      resultsDiv.innerHTML = "Produkt nicht gefunden!";
      return;
    }

    const product = data.product;
    const nutriScore = product.nutrition_grades || "N/A";
    const imageUrl = product.image_url || "";

    resultsDiv.innerHTML = `
      <div class="product">
        <h2>${product.product_name}</h2>
        <img src="${imageUrl}" alt="${product.product_name}" />
        <p>Nutritional Score: ${nutriScore.toUpperCase()}</p>
      </div>
    `;

    if (nutriScore === "a" || nutriScore === "b") {
      resultsDiv.innerHTML += "<p>Das Produkt ist gesund!</p>";
    } else {
      resultsDiv.innerHTML += "<p>Das Produkt ist ungesund. Suche nach Alternativen...</p>";
      findHealthierAlternatives(product.product_name, nutriScore);
    }
  } catch (error) {
    resultsDiv.innerHTML = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
    console.error(error);
  }
}

async function findHealthierAlternatives(searchProductName, currentNutriScore) {
  const resultsDiv = document.getElementById("results");
  const nutriScores = ["a", "b", "c", "d", "e"];
  const betterNutriScores = nutriScores.slice(0, nutriScores.indexOf(currentNutriScore));
  const apiKey = 'sk-pxNju75vKyXJVhjySvLCTdKxluNcijXvQDgFmpRRjZIWgAqe';
  const endpoint = 'https://api.chatanywhere.tech/v1/chat/completions';

  const requestData = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an AI that will get information about a product from an API and then give the user a a term which is not the brand but the name of the product. Example for Nutella nut nougat cream. Nothing more, only the product category, only no sentence.'
      },
      {
        role: 'user',
        content: searchProductName
      }
    ],
    max_tokens: 50,
    temperature: 0.7
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();
    const term = data.choices[0].message.content.trim();
    console.log(term);

      try {
        const response = await fetch(
          `https://world.openfoodfacts.net/api/v2/search?categories_tags=${term}&sort_by=nutriscore&countries_lc=de&fields=product_name,image_url,nutrition_grades`
        );
        const data = await response.json();
      
        const healthierProducts = data.products.filter(product => betterNutriScores.includes(product.nutrition_grades));
      
        if (healthierProducts.length > 0) {
          resultsDiv.innerHTML += `<h3>Gesündere Alternativen in der Kategorie ${term.replace(
            /-/g,
            " "
          )}:</h3>`;
          healthierProducts.slice(0, 5).forEach((product) => {
            const productImageUrl = product.image_url || "";
            resultsDiv.innerHTML += `
                              <div class="product">
                                  <h4>${product.product_name}</h4>
                                  <img src="${productImageUrl}" alt="${
              product.product_name
            }" />
                                  <p>Nutritional Score: ${product.nutrition_grades.toUpperCase()}</p>
                              </div>
                          `;
          });
          return;
        }
      } catch (error) {
        console.error(error);
      }

    resultsDiv.innerHTML += "<p>Keine gesünderen Alternativen gefunden.</p>";
  } catch (error) {
    console.error('Error:', error);
    alert('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
  }
}
