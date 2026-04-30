import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getMenuItemSubmissions, getRestaurantMenuItems, getRestaurants } from "../services/api.js";

const cuisineImageUrls = {
  lebanese: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
  "middle eastern": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
  mediterranean: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  "burgers and bowls": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  "burgers and subs": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  "tacos and burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  halal: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80",
  italian: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
  default: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
};

const restaurantImageUrls = {
  "blazin grill": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
  "chickpea kitchen": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  "dream restaurant": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&q=80",
  "hamido restaurant": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
  "nyc halal eats": "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&q=80",
  "prime eatery": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  "qahwah house": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
  "the spot": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80",
};

export default function RestaurantListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantStats, setRestaurantStats] = useState({});
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRestaurants() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getRestaurants();
        setRestaurants(data);
        const stats = await Promise.all(
          data.map(async (restaurant) => {
            try {
              const menuItems = await getRestaurantMenuItems(restaurant.id);
              const submissionCounts = await Promise.all(
                menuItems.map(async (menuItem) => {
                  try {
                    const submissions = await getMenuItemSubmissions(menuItem.id);
                    return submissions.length;
                  } catch {
                    return 0;
                  }
                })
              );

              return [
                restaurant.id,
                {
                  estimateCount: submissionCounts.reduce((total, count) => total + count, 0),
                  menuItemCount: menuItems.length,
                },
              ];
            } catch {
              return [restaurant.id, { estimateCount: 0, menuItemCount: 0 }];
            }
          })
        );
        setRestaurantStats(Object.fromEntries(stats));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurants();
  }, []);

  useEffect(() => {
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      setSearchParams({ search: trimmedSearch });
    } else {
      setSearchParams({});
    }
  }, [searchTerm, setSearchParams]);

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return restaurants;
    }

    return restaurants.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(normalizedSearch) ||
      getCityFromAddress(restaurant.address).toLowerCase().includes(normalizedSearch)
    );
  }, [restaurants, searchTerm]);

  return (
    <section className="page-section restaurant-page">
      <div className="page-intro">
        <p className="eyebrow">Browse</p>
        <h1>Restaurants</h1>
        <p>Pick a local spot, browse its menu, and compare the community’s nutrition estimates.</p>
      </div>

      <form className="restaurant-toolbar">
        <input
          aria-label="Search restaurants by name or city"
          type="search"
          name="search"
          placeholder="Search by name or city..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <span>Showing {filteredRestaurants.length} restaurants</span>
      </form>

      {isLoading && (
        <div className="restaurant-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="restaurant-card skeleton-card" key={item} />
          ))}
        </div>
      )}
      {error && (
        <div className="empty-state">
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Try again</button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="restaurant-grid">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                stats={restaurantStats[restaurant.id]}
              />
            ))
          ) : (
            <div className="empty-state">
              <p>No restaurants match your search. Try a shorter name or city.</p>
              <button type="button" onClick={() => setSearchTerm("")}>Clear search</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RestaurantCard({ restaurant, stats = {} }) {
  const menuItemCount = stats.menuItemCount || 0;
  const estimateCount = stats.estimateCount || 0;
  const city = getCityFromAddress(restaurant.address);
  const imageUrl = getRestaurantImageUrl(restaurant);

  return (
    <Link className="restaurant-card" to={`/restaurants/${restaurant.id}`}>
      <div className="restaurant-image-wrap">
        <img src={imageUrl} alt="" />
      </div>
      <div className="restaurant-card-body">
        <span className="card-title">{restaurant.name}</span>
        <span className="restaurant-cuisine">{restaurant.cuisine_type}</span>
        <p>{restaurant.address}</p>
        <div className="restaurant-meta">
          <span>{menuItemCount} {menuItemCount === 1 ? "menu item" : "menu items"}</span>
          <span>{estimateCount} {estimateCount === 1 ? "estimate" : "estimates"}</span>
          {city && <span className="location-pill">{city}</span>}
        </div>
      </div>
    </Link>
  );
}

function getRestaurantImageUrl(restaurant) {
  return restaurantImageUrls[restaurant.name.toLowerCase()] || getCuisineImageUrl(restaurant.cuisine_type);
}

function getCuisineImageUrl(cuisineType) {
  return cuisineImageUrls[cuisineType.toLowerCase()] || cuisineImageUrls.default;
}

function getCityFromAddress(address) {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 2];
}
