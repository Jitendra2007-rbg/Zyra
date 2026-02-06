# Location Tracking & Real-time Updates Verification

This walkthrough guides you through testing the new location tracking feature and real-time order updates.

## Prerequisites

1.  **Database Updates**: Ensure you have run the SQL commands in `ADD_LOCATION_COLUMNS.sql`.
2.  **Supabase Realtime**: Ensure Realtime is enabled for the `orders` table in your Supabase dashboard (Database -> Replication).

## Verification Steps

### 1. Real-time Status Updates (Hot Loading Fix)

1.  **Open two browser windows/tabs**:
    *   **Tab A (Customer)**: Go to `/orders` and open an active order.
    *   **Tab B (Shop Owner)**: Go to `/shop/orders` and open the *same* order.
2.  In **Tab B (Shop Owner)**:
    *   Change the order status (e.g., from "Pending" to "Packed").
3.  **Expected Result**:
    *   **Tab A (Customer)** should *instantly* update the status badge to "Packed" without reloading the page.
    *   If this works, the "hot loading" (real-time sync) issue is resolved.

### 2. Location Tracking

1.  **Customer Checkout**:
    *   Add items to cart -> Checkout.
    *   On Address step, click **"Use My Location"**.
    *   Complete order.
2.  **Shop Owner View**:
    *   Open the new order in the dashboard.
    *   Verify the map shows both Blue (Shop) and Red (Customer) markers.
    *   Verify the distance is calculated and displayed.

### 3. Reload Behavior (404 Issue)

1.  On the **Customer Order Details** page (`/orders/:id`).
2.  Reload the page using the browser refresh button.
3.  **Expected**: The page should reload and show the order details again.
    *   *Note*: If you see "Order not found", check if the URL ID is correct.
    *   *Note*: If you see a generic 404 error, ensure your development server is running correctly.

## Troubleshooting

*   **Real-time not working?**
    *   Check browser console for "Order updated:" logs.
    *   Ensure "Replication" is enabled for the `orders` table in Supabase.
*   **404 on Reload?**
    *   If you are redirected to Login, it's normal behavior while the session restores. You should be redirected back or to the home page.
