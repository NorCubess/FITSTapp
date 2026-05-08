// inventory/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

import type { Product } from '@/lib/supabase/database';

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Page component ────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // New product form state
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stock update state — tracks the edited stock value per product id
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 5g — Fetch all products on mount
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // 5h — Create new product
  async function handleCreateProduct() {
    if (!newName.trim() || !newPrice || !newStock || !newCategory.trim()) return;

    setCreating(true);
    setCreateMessage(null);

    const { error } = await supabase.from('products').insert({
      name: newName.trim(),
      price: parseFloat(newPrice),
      stock_quantity: parseInt(newStock, 10),
      category: newCategory.trim(),
    });

    if (error) {
      setCreateMessage({ type: 'error', text: error.message });
    } else {
      setCreateMessage({ type: 'success', text: 'Product created successfully.' });
      setNewName('');
      setNewPrice('');
      setNewStock('');
      setNewCategory('');
      await fetchProducts();
    }

    setCreating(false);
  }

  // 5h — Update stock quantity for an existing product
  async function handleUpdateStock(product: Product) {
    const raw = stockEdits[product.id];
    if (raw === undefined || raw === '') return;

    const newQty = parseInt(raw, 10);
    if (isNaN(newQty) || newQty < 0) return;

    setUpdatingId(product.id);
    setUpdateMessage(null);

    const { error } = await supabase
      .from('products')
      .update({ stock_quantity: newQty })
      .eq('id', product.id);

    if (error) {
      setUpdateMessage({ type: 'error', text: error.message });
    } else {
      setUpdateMessage({ type: 'success', text: `Stock updated for "${product.name}".` });
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      await fetchProducts();
    }

    setUpdatingId(null);
  }

  // 5i — Determine stock highlight class
  function stockClass(qty: number) {
    if (qty === 0) return 'text-red-600 font-semibold';
    if (qty < 5) return 'text-amber-500 font-semibold';
    return 'text-gray-700';
  }

  function rowClass(qty: number) {
    if (qty === 0) return 'bg-red-50';
    if (qty < 5) return 'bg-amber-50';
    return 'bg-white';
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-8">

      {/* ── 5h: New Product Form ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-800">Add New Product</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Protein Bar"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Supplements"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Price (₱)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              placeholder="0"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleCreateProduct}
            disabled={creating || !newName.trim() || !newPrice || !newStock || !newCategory.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {creating ? 'Creating…' : 'Create Product'}
          </button>

          {createMessage && (
            <p className={`text-sm ${createMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {createMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* ── 5g + 5i: Product List ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Product Inventory</h2>
          <p className="mt-1 text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-300 mr-1" />
            Amber = low stock (&lt; 5 units) &nbsp;
            <span className="inline-block w-3 h-3 rounded-full bg-red-300 mr-1" />
            Red = out of stock
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-gray-500">Loading inventory…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-gray-500">No products found.</p>
        ) : (
          <>
            {updateMessage && (
              <p className={`mx-6 mt-4 rounded-lg px-3 py-2 text-sm ${
                updateMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {updateMessage.text}
              </p>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Update Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className={rowClass(product.stock_quantity)}>
                    <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-3 text-gray-500">{product.category}</td>
                    <td className="px-6 py-3 text-gray-700">₱{product.price.toFixed(2)}</td>

                    {/* 5i — Highlighted stock count */}
                    <td className={`px-6 py-3 ${stockClass(product.stock_quantity)}`}>
                      {product.stock_quantity === 0 ? 'Out of stock' : product.stock_quantity}
                    </td>

                    {/* 5h — Inline stock update */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={stockEdits[product.id] ?? ''}
                          onChange={(e) =>
                            setStockEdits((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                          placeholder={String(product.stock_quantity)}
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleUpdateStock(product)}
                          disabled={
                            updatingId === product.id ||
                            stockEdits[product.id] === undefined ||
                            stockEdits[product.id] === ''
                          }
                          className="rounded-lg bg-gray-800 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {updatingId === product.id ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}