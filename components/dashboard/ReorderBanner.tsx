'use client';
import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import { productsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Suggestion {
  sku: string;
  name: string;
  suggestedReorderQty: number;
  reason: string;
}

export default function ReorderBanner() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await productsApi.getReorderSuggestions();
        if (data.success) {
          setSuggestions(data.data || []);
        } else {
          setError('Failed to fetch suggestions');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch suggestions');
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleProductClick = (suggestion: Suggestion) => {
    const params = new URLSearchParams({
      reorder: 'true',
      sku: suggestion.sku,
      qty: suggestion.suggestedReorderQty.toString(),
      productName: suggestion.name
    });
    router.push(`/products?${params.toString()}`);
  };

  if (loading) return null;
  if (error || !suggestions.length) return null;

  const topSuggestions = suggestions.slice(0, 3);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <FiAlertTriangle className="h-6 w-6 text-blue-500" />
        <div>
          <div className="font-semibold text-blue-800">
            AI Suggests Reordering {suggestions.length} Product{suggestions.length > 1 ? 's' : ''}
          </div>
          <ul className="text-blue-700 text-sm mt-1">
            {topSuggestions.map(s => (
              <li key={s.sku}>
                <button
                  onClick={() => handleProductClick(s)}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  {s.name} (SKU: {s.sku})
                </button>
                <span className="ml-1">:</span>
                <span className="ml-1 font-semibold">{s.suggestedReorderQty}</span>
                <span className="ml-2 italic text-xs">{s.reason}</span>
              </li>
            ))}
            {suggestions.length > 3 && (
              <li className="mt-1 text-xs text-blue-600 flex items-center">
                ...and {suggestions.length - 3} more. <span className="ml-1"><FiChevronRight /></span>
              </li>
            )}
          </ul>
        </div>
      </div>
      {/* Optionally, add a button to view all suggestions in a modal or page */}
    </div>
  );
} 