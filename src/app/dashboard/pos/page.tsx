// pos/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// ── Types ────────────────────────────────────────────────────────────────────

import type { Product } from '@/lib/supabase/database';

interface CartItem {
  product: Product;
  quantity: number;
}

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Page component ────────────────────────────────────────────────────────────

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 5b — Fetch all products on mount
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category');

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  // 5d — Add product to cart
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  // 5d — Increase quantity
  function incrementQty(productId: string) {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  // 5d — Decrease quantity (remove if reaches 0)
  function decrementQty(productId: string) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // 5d — Running total
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 5e + 5f — Checkout
  async function handleCheckout() {
    if (cart.length === 0) return;

    setCheckingOut(true);
    setCheckoutMessage(null);

    try {
      // Fetch live stock from DB
      const productIds = cart.map((item) => item.product.id);
      const { data: liveProducts, error: fetchError } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .in('id', productIds);

      if (fetchError) throw fetchError;

      // Validate cart quantities
      for (const item of cart) {
        const live = liveProducts?.find((p) => p.id === item.product.id);
        if (!live || item.quantity > live.stock_quantity) {
          throw new Error(
            `"${item.product.name}" only has ${live?.stock_quantity ?? 0} unit(s) left in stock.`
          );
        }
      }

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        type: 'product',
        items: cart.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
        })),
        total_amount: total,
        payment_method: 'cash',
      });

      if (txError) throw txError;

      // Decrement stock using live values
      for (const item of cart) {
        const live = liveProducts?.find((p) => p.id === item.product.id);
        const newStock = (live?.stock_quantity ?? 0) - item.quantity;

        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      // Refresh products
      const { data: refreshed } = await supabase
        .from('products')
        .select('*')
        .order('category');
      if (refreshed) setProducts(refreshed as Product[]);

      setCart([]);
      setCheckoutMessage({ type: 'success', text: 'Transaction recorded successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during checkout.';
      setCheckoutMessage({ type: 'error', text: message });
    } finally {
      setCheckingOut(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-6 p-6">

      {/* ── Left: Product Grid (5a, 5d) ── */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Products</h2>

        {loading ? (
          <p className="text-gray-500">Loading products…</p>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {product.category}
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">{product.name}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    ₱{product.price.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Stock: {product.stock_quantity}
                  </p>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity === 0}
                  className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {product.stock_quantity === 0 ? 'Out of stock' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Cart Panel (5a, 5d, 5e) ── */}
      <div className="flex w-80 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Cart</h2>

        {cart.length === 0 ? (
          <p className="flex-1 text-sm text-gray-400">No items added yet.</p>
        ) : (
          <ul className="flex-1 space-y-3 overflow-y-auto">
            {cart.map((item) => (
              <li
                key={item.product.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₱{item.product.price.toFixed(2)} each
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => decrementQty(item.product.id)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => incrementQty(item.product.id)}
                    className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>

                <p className="w-16 text-right text-sm font-semibold text-gray-700">
                  ₱{(item.product.price * item.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Running total */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex justify-between text-base font-semibold text-gray-800">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>

          {/* Checkout feedback */}
          {checkoutMessage && (
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                checkoutMessage.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {checkoutMessage.text}
            </p>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
            className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {checkingOut ? 'Processing…' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}