async function searchProduct() {
  const input = document.getElementById("productInput").value;
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "Suche läuft...";

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${input}?fields=product_name,image_url,nutrition_grades,categories_tags`
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
      resultsDiv.innerHTML +=
        "<p id='alternative-message'>Das Produkt ist ungesund. Suche nach Alternativen...</p>";
      findHealthierAlternatives(product.categories_tags, nutriScore);
    }
  } catch (error) {
    resultsDiv.innerHTML =
      "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
    console.error(error);
  }
}

async function findHealthierAlternatives(categories, currentNutriScore) {
  const resultsDiv = document.getElementById("results");
  const alternativeMessage = document.getElementById("alternative-message");
  const nutriScores = ["a", "b", "c", "d", "e"];
  const betterNutriScores = nutriScores.slice(
    0,
    nutriScores.indexOf(currentNutriScore)
  );

  for (const category of categories) {
    for (const nutriScore of betterNutriScores) {
      try {
        const response = await fetch(
          `https://world.openfoodfacts.net/api/v2/search?categories_tags=${category}&nutrition_grades_tags=${nutriScore}&countries_hierarchy=en:germany&fields=product_name,image_url,nutrition_grades`
        );
        const data = await response.json();

        const healthierProducts = data.products;

        if (healthierProducts.length > 0) {
          alternativeMessage.remove();
          resultsDiv.innerHTML += `<h3>Gesündere Alternativen in der Kategorie ${category.replace(
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
    }
  }

  alternativeMessage.remove();
  resultsDiv.innerHTML += "<p>Keine gesünderen Alternativen gefunden.</p>";
}
