let menuData = null;
let allItems = [];

async function loadMenu() {
  try {
    const response = await fetch("./menu.json");

    if (!response.ok) {
      throw new Error("Speisekarte konnte nicht geladen werden");
    }

    menuData = await response.json();

    setupRestaurant();

    renderMenu();

    prepareRandomItems();

    checkUrl();
  } catch (error) {
    console.error(error);

    document.getElementById("menu").innerHTML = `
            <div class="loading">
                ❌ Die Speisekarte konnte nicht geladen werden.
            </div>
        `;
  }
}

function setupRestaurant() {
  if (!menuData.restaurant) {
    return;
  }

  document.title = menuData.restaurant.name;

  document.getElementById("restaurant-name").textContent =
    menuData.restaurant.name;

  document.getElementById("restaurant-subtitle").textContent =
    menuData.restaurant.subtitle;
}

function renderMenu() {
  const menuElement = document.getElementById("menu");

  menuElement.innerHTML = "";

  menuData.categories.forEach((category) => {
    const section = document.createElement("section");

    section.className = "category";

    section.innerHTML = `

                <h2 class="category-title">
                    <span>
                        ${category.emoji || "🍽️"}
                    </span>

                    ${category.name}
                </h2>

                <div class="menu-list"></div>
            `;

    const list = section.querySelector(".menu-list");

    category.items.forEach((item) => {
      const itemElement = document.createElement("div");

      itemElement.className = "menu-item";

      itemElement.innerHTML = `

                        <div
                            class="menu-item-emoji"
                        >
                            ${item.emoji || "🍽️"}
                        </div>

                        <div
                            class="menu-item-content"
                        >
                            <h3>
                                ${item.name}
                            </h3>

                            <p>
                                ${item.description || ""}
                            </p>
                        </div>
                    `;

      list.appendChild(itemElement);
    });

    menuElement.appendChild(section);
  });
}

function prepareRandomItems() {
  allItems = [];

  menuData.categories.forEach((category) => {
    category.items.forEach((item) => {
      allItems.push({
        ...item,
        category: category.name,
      });
    });
  });
}

function getRandomItem() {
  const index = Math.floor(Math.random() * allItems.length);

  return allItems[index];
}

function showRandomItem() {
  if (!allItems || allItems.length === 0) {
    return;
  }

  const item = getRandomItem();

  document.getElementById("random-emoji").textContent = item.emoji || "🍽️";

  document.getElementById("random-name").textContent = item.name;

  document.getElementById("random-description").textContent =
    item.description || "";

  document.getElementById("random-modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("random-modal").classList.add("hidden");
}

function checkUrl() {
  const hash = window.location.hash;

  if (hash === "#random") {
    showRandomItem();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMenu();

  document
    .getElementById("random-button")
    .addEventListener("click", showRandomItem);

  document
    .getElementById("again-button")
    .addEventListener("click", showRandomItem);

  document.getElementById("close-modal").addEventListener("click", closeModal);

  document
    .querySelector(".modal-backdrop")
    .addEventListener("click", closeModal);
});
