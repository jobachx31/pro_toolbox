// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- DATA ---
  // --- DOM ELEMENTS ---
  const toolsGrid = document.getElementById("tools-grid");
  const searchBar = document.getElementById("search-bar");
  const favoritesToggle = document.getElementById("favorites-toggle");
  const emptyState = document.getElementById("empty-state");

  // --- STATE ---
  let favorites = JSON.parse(localStorage.getItem("toolboxFavorites")) || [];
  let isFavoritesView = false;
  let isInitialLoad = true; // Flag to handle initial animation

  // --- FUNCTIONS ---

  /**
   * Renders the tool cards to the DOM.
   * @param {Array} toolsToRender - The array of tool objects to display.
   */
  const renderTools = (toolsToRender) => {
    // Clear the grid and hide empty state
    toolsGrid.innerHTML = "";
    emptyState.style.display = "none";

    // Handle empty states
    if (toolsToRender.length === 0) {
      emptyState.style.display = "block";
      if (isFavoritesView) {
        emptyState.innerHTML = `<h2>No Favorites Yet</h2><p>Click the star on any tool to add it to your favorites.</p>`;
      } else {
        emptyState.innerHTML = `<h2>No Tools Found</h2><p>Try a different search term.</p>`;
      }
      return;
    }

    // Create a card for each tool
    toolsToRender.forEach((tool, index) => {
      const isFavorited = favorites.includes(tool.name);

      // Create the card link
      const card = document.createElement("a");
      card.href = tool.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.className = "tool-card";
      // Apply cascading animation class and delay only on the initial page load
      if (isInitialLoad) {
        card.classList.add("initial-load-animation");
        card.style.animationDelay = `${index * 50}ms`;
      }

      card.innerHTML = `
                <div class="card-header">
                    <h3>${tool.name}</h3>
                    <button class="favorite-btn ${
                      isFavorited ? "favorited" : ""
                    }" data-tool-name="${tool.name}">
                        <i class="fa-solid fa-star"></i>
                    </button>
                </div>
                <p>${tool.description}</p>
                <div class="tags-container">
                    ${tool.tags
                      .slice(0, 3)
                      .map((tag) => `<span class="tag">${tag}</span>`)
                      .join("")}
                </div>
            `;

      // Add event listener to the favorite button
      const favButton = card.querySelector(".favorite-btn");
      favButton.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent card navigation
        e.stopPropagation(); // Stop event from bubbling up to the card link
        toggleFavorite(tool.name, favButton);
      });

      // Append the card to the grid
      toolsGrid.appendChild(card);
    });

    // The initial load is complete, so disable the flag
    isInitialLoad = false;
  };

  /**
   * Toggles a tool's favorite status and updates localStorage.
   * @param {string} toolName - The name of the tool to toggle.
   * @param {HTMLElement} buttonElement - The button element that was clicked.
   */
  const toggleFavorite = (toolName, buttonElement) => {
    const index = favorites.indexOf(toolName);
    if (index > -1) {
      // Remove from favorites
      favorites.splice(index, 1);
      buttonElement.classList.remove("favorited");
    } else {
      const isSearching = searchBar.value.trim() !== "";
      // Add to favorites
      favorites.push(toolName);
      buttonElement.classList.add("favorited");
      // If searching, prevent the "spammy" animation by temporarily disabling it
      if (isSearching) {
        buttonElement.style.animation = "none";
      }
    }
    // Save updated favorites to localStorage
    localStorage.setItem("toolboxFavorites", JSON.stringify(favorites));

    // Always re-render the list to reflect the change in favorite status and order.
    filterAndRender();
  };

  const animateOnScroll = () => {
    const cards = document.querySelectorAll(".tool-card");

    cards.forEach((card, index) => {
      const cardTop = card.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      if (cardTop < windowHeight * 0.75) {
        card.classList.add("card-fade-in");
      }
    });
  };

  window.addEventListener("scroll", () => {
    if (!searchBar.value) animateOnScroll();
  });

  /**
   * Filters tools based on search term and favorites view, then renders them.
   */
  const filterAndRender = () => {
    const searchTerm = searchBar.value.toLowerCase();
    let filteredTools = tools;
    // 1. Filter by "Show Favorites" toggle
    if (isFavoritesView) {
      filteredTools = filteredTools.filter((tool) =>
        favorites.includes(tool.name)
      );
    }

    // 2. Filter by search term
    if (searchTerm) {
      // Split search term into keywords to allow for non-sequential matching
      const keywords = searchTerm.split(" ").filter(Boolean); // `filter(Boolean)` removes empty strings

      filteredTools = filteredTools.filter((tool) => {
        // Combine all searchable text into one string for easier searching
        const toolText = (
          tool.name +
          " " +
          tool.description +
          " " +
          tool.tags.join(" ")
        ).toLowerCase();

        // Check if all keywords are present in the tool's combined text
        return keywords.every((keyword) => toolText.includes(keyword));
      });
    }

    // 3. Sort the filtered tools to show favorites at the top
    // This works by treating boolean `true` as 1 and `false` as 0.
    // If b is a favorite (1) and a is not (0), the result is 1, so b is sorted before a.
    // If both are the same, the result is 0, and their order is unchanged.
    filteredTools.sort(
      (a, b) => favorites.includes(b.name) - favorites.includes(a.name)
    );

    renderTools(filteredTools);
  };

  // --- EVENT LISTENERS ---

  // Handle logo click for a clean page refresh
  const headerLink = document.querySelector(".header-link");
  if (headerLink) {
    headerLink.addEventListener("click", (e) => {
      // Prevent the default link navigation
      e.preventDefault();
      // Reload the page from the server, bypassing the cache for the main document
      window.location.href = window.location.origin + window.location.pathname;
    });
  }
  // Handle "Enter" key press on the search bar
  searchBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // Prevent default form submission behavior
      e.preventDefault();

      // We need to get the current filtered results to see if there's only one
      const searchTerm = searchBar.value.toLowerCase();
      let currentFilteredTools = tools;

      if (isFavoritesView) {
        currentFilteredTools = currentFilteredTools.filter((tool) =>
          favorites.includes(tool.name)
        );
      }

      if (searchTerm) {
        // Use the same improved search logic here for consistency
        const keywords = searchTerm.split(" ").filter(Boolean);

        currentFilteredTools = currentFilteredTools.filter((tool) => {
          const toolText = (
            tool.name +
            " " +
            tool.description +
            " " +
            tool.tags.join(" ")
          ).toLowerCase();

          // Check if all keywords are present
          return keywords.every((keyword) => toolText.includes(keyword));
        });
      }

      // If there is exactly one tool, open it
      if (currentFilteredTools.length === 1) {
        window.open(currentFilteredTools[0].url, "_blank");
      }
    }
  });

  // Live search on key input
  searchBar.addEventListener("input", filterAndRender);

  // Toggle favorites view
  favoritesToggle.addEventListener("click", () => {
    isFavoritesView = !isFavoritesView;
    favoritesToggle.classList.toggle("active", isFavoritesView);

    // Update button text/icon based on state
    const buttonText = favoritesToggle.childNodes[2]; // Get the text node
    if (isFavoritesView) {
      favoritesToggle.querySelector("i").className = "fa-solid fa-star";
      buttonText.nodeValue = " Show All";
    } else {
      favoritesToggle.querySelector("i").className = "fa-regular fa-star";
      buttonText.nodeValue = " Show Favorites";
    }

    filterAndRender();
  });

  // Fetch tools from JSON file
  fetch("tools.json")
    .then((response) => response.json())
    .then((data) => {
      window.tools = data;
      // Use filterAndRender for the initial render to apply sorting
      filterAndRender();
    })
    .catch((error) => {
      console.error("Error fetching tools:", error);
      emptyState.style.display = "block";
      emptyState.innerHTML = `<h2>Error Loading Tools</h2><p>Please try again later.</p>`;
    });

  // --- INITIAL RENDER ---
  // Initial render of all tools on page load
  searchBar.focus(); // Pre-focus the search bar on page load

  // --- SERVICE WORKER REGISTRATION ---
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope
          );
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed: ", error);
        });
    });
  }
});
