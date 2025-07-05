'use client';
import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import { productsApi } from '@/lib/api';

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
                <span className="font-medium">{s.name}</span> (SKU: {s.sku}):
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