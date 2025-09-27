'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PromoCodeInputProps {
  onPromoApplied: (promoCode: string, discount: any) => void;
  onPromoRemoved: () => void;
  appliedPromo?: string | null;
  discount?: any;
}

export default function PromoCodeInput({ 
  onPromoApplied, 
  onPromoRemoved, 
  appliedPromo, 
  discount 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validatePromoCode = async (code: string) => {
    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: code }),
      });

      const data = await response.json();

      if (response.ok) {
        onPromoApplied(code, data.discount);
        setPromoCode('');
      } else {
        setError(data.error || 'Invalid promo code');
      }
    } catch (error) {
      setError('Failed to validate promo code. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    validatePromoCode(promoCode.trim().toUpperCase());
  };

  const handleRemove = () => {
    onPromoRemoved();
    setError('');
  };

  if (appliedPromo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                Promo code <span className="font-mono">{appliedPromo}</span> applied!
              </p>
              {discount && (
                <p className="text-xs text-green-600">
                  {discount.type === 'percentage' 
                    ? `${discount.value}% off` 
                    : `$${discount.value} off`
                  }
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            disabled={isValidating}
          />
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={!promoCode.trim() || isValidating}
          className="bg-black text-white hover:bg-gray-800 px-4 py-2 text-sm"
        >
          {isValidating ? 'Validating...' : 'Apply'}
        </Button>
      </form>
    </div>
  );
}
