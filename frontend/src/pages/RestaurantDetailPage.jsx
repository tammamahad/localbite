import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getRestaurant, getRestaurantMenuItems } from "../services/api.js";

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRestaurantDetail() {
      setIsLoading(true);
      setError("");

      try {
        const [restaurantData, menuItemsData] = await Promise.all([
          getRestaurant(restaurantId),
          getRestaurantMenuItems(restaurantId),
        ]);
        setRestaurant(restaurantData);
        setMenuItems(menuItemsData);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurantDetail();
  }, [restaurantId]);

  return (
    <section className="page-section">
      <p className="eyebrow">Restaurant</p>
      <h1>{restaurant?.name || "Restaurant Details"}</h1>

      {isLoading && <div className="empty-state"><p>Loading restaurant...</p></div>}
      {error && (
        <div className="empty-state">
          <p>{error}</p>
          <Link className="text-link" to="/restaurants">Back to restaurants</Link>
        </div>
      )}

      {!isLoading && !error && restaurant && (
        <>
          <div className="detail-panel">
            <p>{restaurant.cuisine_type}</p>
            <p>{restaurant.address}</p>
          </div>

          <div className="section-heading">
            <h2>Menu Items</h2>
            <Link className="text-link" to="/restaurants">
              Back to restaurants
            </Link>
          </div>

          <div className="item-list">
            {menuItems.length > 0 ? (
              menuItems.map((menuItem) => (
                <Link className="list-card" key={menuItem.id} to={`/menu-items/${menuItem.id}`}>
                  <span className="card-title">{menuItem.name}</span>
                  <span>{menuItem.description}</span>
                </Link>
              ))
            ) : (
              <div className="empty-state">
                <p>No menu items have been added yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
