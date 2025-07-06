'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { FiAlertTriangle, FiChevronRight, FiRefreshCw, FiClock } from 'react-icons/fi';
import { productsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Suggestion {
  sku: string;
  name: string;
  suggestedReorderQty: number;
  reason: string;
}

interface ApiResponse {
  success: boolean;
  data: Suggestion[];
  cached?: boolean;
  meta?: {
    processingTime: number;
    productCount: number;
    cached: boolean;
  };
}

export default function ReorderBanner() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  const fetchSuggestions = useCallback(async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const startTime = Date.now();
      const data: ApiResponse = await productsApi.getReorderSuggestions();
      const fetchTime = Date.now() - startTime;
      
      if (data.success) {
        setSuggestions(data.data || []);
        setIsCached(data.cached || false);
        setProcessingTime(data.meta?.processingTime || fetchTime);
        setRetryCount(0); // Reset retry count on success
      } else {
        setError('Failed to fetch AI suggestions');
      }
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      
      if (err.message.includes('timeout')) {
        setError('AI request timed out. This may happen during high load.');
      } else if (err.message.includes('blocked')) {
        setError('AI service temporarily unavailable.');
      } else {
        setError(err.message || 'Failed to fetch AI suggestions');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchSuggestions(true);
  };

  const handleForceRefresh = async () => {
    try {
      setLoading(true);
      // Clear cache first, then fetch fresh data
      await productsApi.clearReorderSuggestionsCache();
      await fetchSuggestions(true);
    } catch (err) {
      console.error('Error force refreshing suggestions:', err);
      setError('Failed to refresh suggestions');
      setLoading(false);
    }
  };

  const handleProductClick = (suggestion: Suggestion) => {
    const params = new URLSearchParams({
      reorder: 'true',
      sku: suggestion.sku,
      qty: suggestion.suggestedReorderQty.toString(),
      productName: suggestion.name
    });
    router.push(`/products?${params.toString()}`);
  };

  // Loading state with better UX
  if (loading) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiRefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          <div>
            <div className="font-semibold text-blue-800">
              🤖 AI is analyzing your inventory...
            </div>
            <p className="text-blue-700 text-sm mt-1">
              This may take a few seconds for accurate suggestions
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
          <div className="flex-1">
            <div className="font-semibold text-yellow-800">
              AI Suggestions Temporarily Unavailable
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={loading}
          className="ml-4 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-sm rounded-md transition-colors flex items-center space-x-1 disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // No suggestions
  if (!suggestions.length) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiAlertTriangle className="h-6 w-6 text-green-500" />
          <div>
            <div className="font-semibold text-green-800">
              ✅ All Products Well Stocked
            </div>
            <p className="text-green-700 text-sm mt-1">
              No reordering needed at this time
            </p>
          </div>
        </div>
        {processingTime && (
          <div className="text-xs text-green-600 flex items-center space-x-1">
            <FiClock className="h-3 w-3" />
            <span>{processingTime}ms</span>
          </div>
        )}
      </div>
    );
  }

  const topSuggestions = suggestions.slice(0, 3);

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <FiAlertTriangle className="h-6 w-6 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-blue-800">
              🤖 AI Suggests Reordering {suggestions.length} Product{suggestions.length > 1 ? 's' : ''}
            </div>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              {topSuggestions.map(s => (
                <li key={s.sku} className="flex items-start">
                  <button
                    onClick={() => handleProductClick(s)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
                  >
                    {s.name} (SKU: {s.sku})
                  </button>
                  <span className="ml-1">:</span>
                  <span className="ml-1 font-semibold">{s.suggestedReorderQty}</span>
                  <span className="ml-2 italic text-xs text-blue-600">
                    {s.reason}
                  </span>
                </li>
              ))}
              {suggestions.length > 3 && (
                <li className="mt-2 text-xs text-blue-600 flex items-center">
                  ...and {suggestions.length - 3} more items need attention
                  <FiChevronRight className="ml-1 h-3 w-3" />
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Performance indicators */}
        <div className="text-xs text-blue-600 flex flex-col items-end space-y-1">
          {isCached && (
            <div className="bg-blue-200 px-2 py-1 rounded text-blue-800">
              Cached
            </div>
          )}
          {processingTime && (
            <div className="flex items-center space-x-1">
              <FiClock className="h-3 w-3" />
              <span>{processingTime}ms</span>
            </div>
          )}
          <button
            onClick={isCached ? handleForceRefresh : handleRetry}
            className="p-1 hover:bg-blue-200 rounded transition-colors"
            title={isCached ? "Force refresh (clear cache)" : "Refresh suggestions"}
            disabled={loading}
          >
            <FiRefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
} 