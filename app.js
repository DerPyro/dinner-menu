let menuData = null;

let allMeals = [];

let selectedTags = new Set();

let availableIngredients = new Set();

const STORAGE_KEY = "brewo-available-ingredients";

const CATEGORY_NAMES = {
  appetizers: "Vorspeisen",

  mainCourse: "Hauptgerichte",

  dessert: "Desserts",

  drinks: "Getränke",
};

/* =========================
   INITIALISIERUNG
========================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  loadStoredIngredients();

  await loadMenu();

  setupEventListeners();

  checkUrl();
}

/* =========================
   MENU LADEN
========================= */

async function loadMenu() {
  try {
    const response = await fetch("./menu.json");

    if (!response.ok) {
      throw new Error("menu.json konnte nicht geladen werden");
    }

    menuData = await response.json();

    setupRestaurant();

    prepareMeals();

    renderTagFilters();

    renderIngredients();

    renderSuggestions();

    renderMenu();
  } catch (error) {
    console.error(error);

    document.getElementById("menu").innerHTML = `
            <p>
                ❌ Speisekarte konnte nicht geladen werden.
            </p>
        `;
  }
}

/* =========================
   RESTAURANT
========================= */

function setupRestaurant() {
  const restaurant = menuData.restaurant;

  document.title = restaurant.name;

  document.getElementById("restaurant-name").textContent = restaurant.name;

  document.getElementById("restaurant-subtitle").textContent =
    restaurant.subtitle;
}

/* =========================
   GERICHTE VORBEREITEN
========================= */

function prepareMeals() {
  allMeals = [];

  Object.entries(menuData).forEach(([category, meals]) => {
    if (category === "restaurant" || !Array.isArray(meals)) {
      return;
    }

    meals.forEach((meal) => {
      allMeals.push({
        ...meal,

        category,
      });
    });
  });
}

/* =========================
   TAGS
========================= */

function getAllTags() {
  const tags = new Set();

  allMeals.forEach((meal) => {
    meal.tags?.forEach((tag) => {
      tags.add(tag);
    });
  });

  return Array.from(tags).sort();
}

function renderTagFilters() {
  const container = document.getElementById("tag-filters");

  container.innerHTML = "";

  getAllTags().forEach((tag) => {
    const button = document.createElement("button");

    button.className = "tag-filter";

    button.textContent = tag;

    if (selectedTags.has(tag)) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      toggleTag(tag);
    });

    container.appendChild(button);
  });
}

function toggleTag(tag) {
  if (selectedTags.has(tag)) {
    selectedTags.delete(tag);
  } else {
    selectedTags.add(tag);
  }

  renderTagFilters();

  renderSuggestions();

  renderMenu();
}

/* =========================
   ZUTATEN
========================= */

function getAllIngredients() {
  const ingredients = new Set();

  allMeals.forEach((meal) => {
    meal.ingredients?.forEach((ingredient) => {
      ingredients.add(ingredient);
    });
  });

  return Array.from(ingredients).sort();
}

function renderIngredients() {
  const container = document.getElementById("ingredient-list");

  container.innerHTML = "";

  getAllIngredients().forEach((ingredient) => {
    const label = document.createElement("label");

    label.className = "ingredient-checkbox";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.checked = availableIngredients.has(ingredient);

    checkbox.addEventListener("change", () => {
      toggleIngredient(ingredient, checkbox.checked);
    });

    const text = document.createElement("span");

    text.textContent = ingredient;

    label.appendChild(checkbox);

    label.appendChild(text);

    container.appendChild(label);
  });
}

function toggleIngredient(ingredient, available) {
  if (available) {
    availableIngredients.add(ingredient);
  } else {
    availableIngredients.delete(ingredient);
  }

  saveIngredients();

  renderSuggestions();

  renderMenu();
}

/* =========================
   LOCAL STORAGE
========================= */

function loadStoredIngredients() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return;
  }

  try {
    const ingredients = JSON.parse(stored);

    availableIngredients = new Set(ingredients);
  } catch (error) {
    console.error("Fehler beim Laden der Zutaten", error);
  }
}

function saveIngredients() {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(Array.from(availableIngredients)),
  );
}

/* =========================
   FILTER
========================= */

function getFilteredMeals() {
  return allMeals.filter((meal) => {
    /*
     * Keine Tags ausgewählt
     */

    if (selectedTags.size === 0) {
      return true;
    }

    /*
     * OR-Filter:
     * Mindestens ein Tag passt
     */

    return meal.tags?.some((tag) => selectedTags.has(tag));
  });
}

/* =========================
   ZUTATEN MATCH
========================= */

function getIngredientMatch(meal) {
  const ingredients = meal.ingredients || [];

  const available = ingredients.filter((ingredient) =>
    availableIngredients.has(ingredient),
  );

  const missing = ingredients.filter(
    (ingredient) => !availableIngredients.has(ingredient),
  );

  return {
    total: ingredients.length,

    available: available.length,

    missing,

    percentage:
      ingredients.length === 0 ? 0 : available.length / ingredients.length,
  };
}

/* =========================
   VORSCHLÄGE
========================= */

function renderSuggestions() {
  const container = document.getElementById("suggestions");

  const meals = getFilteredMeals()
    .map((meal) => ({
      meal,

      match: getIngredientMatch(meal),
    }))
    .sort((a, b) => {
      /*
       * Weniger fehlende
       * Zutaten zuerst
       */

      return a.match.missing.length - b.match.missing.length;
    });

  container.innerHTML = "";

  if (meals.length === 0) {
    container.innerHTML = `
                <p>
                    Keine passenden
                    Gerichte gefunden.
                </p>
            `;

    return;
  }

  meals.forEach(({ meal, match }) => {
    const element = createMealCard(meal, match, true);

    container.appendChild(element);
  });
}

/* =========================
   SPEISEKARTE
========================= */

function renderMenu() {
  const container = document.getElementById("menu");

  container.innerHTML = "";

  Object.entries(menuData).forEach(([category, meals]) => {
    if (
      category === "restaurant" ||
      !Array.isArray(meals) ||
      meals.length === 0
    ) {
      return;
    }

    const filteredMeals = meals.filter((meal) => {
      if (selectedTags.size === 0) {
        return true;
      }

      return meal.tags?.some((tag) => selectedTags.has(tag));
    });

    if (filteredMeals.length === 0) {
      return;
    }

    const section = document.createElement("section");

    section.className = "category";

    const title = document.createElement("h2");

    title.className = "category-title";

    title.textContent = CATEGORY_NAMES[category] || category;

    section.appendChild(title);

    const list = document.createElement("div");

    list.className = "menu-list";

    filteredMeals.forEach((meal) => {
      list.appendChild(createMealCard(meal, getIngredientMatch(meal), false));
    });

    section.appendChild(list);

    container.appendChild(section);
  });
}

/* =========================
   GERICHT KARTE
========================= */

function createMealCard(meal, match, showMatch) {
  const card = document.createElement("article");

  card.className = "meal-card";

  const title = document.createElement("h3");

  title.textContent = meal.name;

  card.appendChild(title);

  /*
   * TAGS
   */

  if (meal.tags?.length) {
    const tags = document.createElement("div");

    tags.className = "tags";

    meal.tags.forEach((tag) => {
      const tagElement = document.createElement("span");

      tagElement.className = "tag";

      tagElement.textContent = tag;

      tags.appendChild(tagElement);
    });

    card.appendChild(tags);
  }

  /*
   * ZUTATEN
   */

  const ingredients = document.createElement("p");

  ingredients.className = "meal-ingredients";

  ingredients.textContent = "🥬 " + meal.ingredients.join(" · ");

  card.appendChild(ingredients);

  /*
   * MATCH
   */

  if (showMatch) {
    const matchElement = document.createElement("div");

    matchElement.className = "ingredient-match";

    matchElement.textContent =
      match.available + " / " + match.total + " Zutaten vorhanden";

    card.appendChild(matchElement);

    if (match.missing.length > 0) {
      const missing = document.createElement("p");

      missing.className = "missing-ingredients";

      missing.textContent = "Fehlt: " + match.missing.join(", ");

      card.appendChild(missing);
    } else {
      const perfect = document.createElement("p");

      perfect.className = "perfect-match";

      perfect.textContent = "✓ Direkt kochbar";

      card.appendChild(perfect);
    }
  }

  return card;
}

/* =========================
   RANDOM
========================= */

function getRandomMeal() {
  const meals = getFilteredMeals();

  if (meals.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * meals.length);

  return meals[index];
}

function showRandomMeal() {
  const meal = getRandomMeal();

  if (!meal) {
    alert("Keine passenden Gerichte gefunden.");

    return;
  }

  const match = getIngredientMatch(meal);

  document.getElementById("random-name").textContent = meal.name;

  const tagsContainer = document.getElementById("random-tags");

  tagsContainer.innerHTML = "";

  meal.tags?.forEach((tag) => {
    const element = document.createElement("span");

    element.className = "tag";

    element.textContent = tag;

    tagsContainer.appendChild(element);
  });

  const ingredientsContainer = document.getElementById("random-ingredients");

  ingredientsContainer.innerHTML = `
            <p>
                🥬
                ${match.available}
                /
                ${match.total}
                Zutaten vorhanden
            </p>
        `;

  if (match.missing.length === 0) {
    ingredientsContainer.innerHTML += `
                <p class="perfect-match">
                    ✓ Alles vorhanden!
                </p>
            `;
  } else {
    ingredientsContainer.innerHTML += `
                <p class="missing-ingredients">
                    Fehlt:
                    ${match.missing.join(", ")}
                </p>
            `;
  }

  document.getElementById("random-modal").classList.remove("hidden");
}

/* =========================
   EVENT LISTENER
========================= */

function setupEventListeners() {
  document
    .getElementById("random-button")
    .addEventListener("click", showRandomMeal);

  document
    .getElementById("again-button")
    .addEventListener("click", showRandomMeal);

  document.getElementById("close-modal").addEventListener("click", closeModal);

  document
    .querySelector(".modal-backdrop")
    .addEventListener("click", closeModal);
}

/* =========================
   MODAL
========================= */

function closeModal() {
  document.getElementById("random-modal").classList.add("hidden");
}

/* =========================
   URL
========================= */

function checkUrl() {
  if (window.location.hash === "#random") {
    showRandomMeal();
  }
}
