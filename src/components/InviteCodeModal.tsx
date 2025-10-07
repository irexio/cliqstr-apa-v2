'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, TicketIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface InviteCodeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function InviteCodeModal({ open, setOpen }: InviteCodeModalProps) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input field when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Close the modal
  const handleClose = () => {
    setOpen(false);
    setInviteCode('');
    setError('');
    setSuccess(false);
    setInviteData(null);
  };
  
  // Real-time invite code validation
  const validateInviteCode = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/validate-invite?code=${code.trim()}`);
      const data = await response.json();
      
      if (data.valid) {
        setSuccess(true);
        setError('');
        setInviteData(data);
      } else {
        setSuccess(false);
        setError(data.message || 'Invalid invite code');
        setInviteData(null);
      }
    } catch (error) {
      setSuccess(false);
      setError('Unable to validate code');
      setInviteData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input change with debounced validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value;
    setInviteCode(newCode);
    
    // Clear previous timeout
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    // Reset states if input is cleared
    if (!newCode.trim()) {
      setError('');
      setSuccess(false);
      setInviteData(null);
      return;
    }
    
    // Debounce validation (500ms)
    const timeout = setTimeout(() => {
      validateInviteCode(newCode);
    }, 500);
    
    setValidationTimeout(timeout);
  };

  // Submit the invite code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    
    // Close modal and redirect to manual invite page with the code
    handleClose();
    router.push(`/invite/manual?code=${encodeURIComponent(inviteCode.trim())}`);
  };
  
  // Handle pasted content
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText) {
      // Automatically submit if a code is pasted
      setTimeout(() => {
        validateInviteCode(pastedText.trim());
      }, 100);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-4 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <TicketIcon className="h-8 w-8 text-[#c032d1]" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">Join a Cliq</h2>
        
        <p className="text-gray-600 mb-6 text-center">
          Enter your invite code to join a private cliq
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={handleInputChange}
                onPaste={handlePaste}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all text-black ${
                  success ? 'border-green-500 bg-green-50' : 
                  error ? 'border-red-500 bg-red-50' : 
                  'border-gray-300 focus:ring-[#c032d1] focus:border-[#c032d1]'
                }`}
                placeholder="Enter your invite code"
                disabled={loading}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-[#c032d1] border-t-transparent rounded-full"></div>
                </div>
              )}
              {success && !loading && (
                <CheckCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
              {error && !loading && (
                <ExclamationCircleIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
              )}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            {success && inviteData && (
              <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-800 font-medium">Valid invite code!</p>
                {inviteData.inviterEmail && (
                  <p className="text-xs text-green-700 mt-1">From: {inviteData.inviterEmail}</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full font-semibold px-4 py-3 rounded-lg text-sm transition-all ${
              success 
                ? 'bg-gradient-to-r from-[#c032d1] to-purple-700 text-white hover:from-[#d83ee4] hover:to-purple-600' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
            disabled={loading}
          >
            {loading ? 'Checking...' : success ? 'Join Now' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
