'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

interface ChildCreateModalProps {
  inviteId?: string;
  inviteCode?: string;
  prefillFirstName?: string;
  prefillLastName?: string;
  stepIndex?: number;
  totalSteps?: number;
}

export default function ChildCreateModal({ inviteId, inviteCode, prefillFirstName, prefillLastName, stepIndex, totalSteps }: ChildCreateModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Generate username suggestion based on child's name
  useEffect(() => {
    if (prefillFirstName && prefillLastName) {
      const firstName = prefillFirstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastName = prefillLastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const year = new Date().getFullYear();
      
      // Generate a few options and pick one
      const options = [
        `${firstName}_${lastName}`,
        `${firstName}${lastName}${year}`,
        `${firstName[0]}${lastName}`,
      ];
      setSuggestedUsername(options[0]);
    }
  }, [prefillFirstName, prefillLastName]);

  // Generate a memorable password
  useEffect(() => {
    const words = ['Sunshine', 'Rainbow', 'Happy', 'Buddy', 'Star', 'Magic', 'Dream', 'Smile'];
    const numbers = ['2025', '123', '789', '456'];
    const symbols = ['!', '@', '#', '*'];
    
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const num = numbers[Math.floor(Math.random() * numbers.length)];
    const sym = symbols[Math.floor(Math.random() * symbols.length)];
    
    setGeneratedPassword(`${word1}${num}${word2}${sym}`);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: (fd.get('firstName') as string)?.trim(),
      lastName: (fd.get('lastName') as string)?.trim(),
      username: (fd.get('username') as string)?.trim(),
      password: (fd.get('password') as string) || '',
      birthdate: (fd.get('birthdate') as string) || '',
      code: inviteCode, // API expects 'code' not 'inviteId'
    };

    console.log('[CHILD_CREATE] Submitting child creation:', { 
      ...payload, 
      password: '***',
      inviteCode 
    });

    try {
      const res = await fetch('/api/parent/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      console.log('[CHILD_CREATE] API response:', { ok: res.ok, data });
      
      if (!res.ok || !data?.ok) {
        // Use the specific message if provided, otherwise fallback to reason or generic error
        const errorMessage = data?.message || 
                           (data?.reason === 'username_taken' ? 'This username is already taken. Please choose another.' : 
                            data?.reason === 'duplicate_child' ? data?.message : 
                            data?.reason || 'Unable to create child account. Please try again.');
        console.error('[CHILD_CREATE] Failed:', errorMessage);
        setErr(errorMessage);
        setSubmitting(false);
        return;
      }

      // Success - redirect to dashboard or permissions page
      // The child account has been created and linked to the parent
      console.log('[CHILD_CREATE] Success! Redirecting to dashboard...');
      
      // Small delay to ensure database writes are complete
      setTimeout(() => {
        window.location.href = '/parents/hq';
      }, 500);
    } catch (e) {
      setErr('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-800 border-b border-gray-600 py-8 text-white">
      <div className="max-w-md mx-auto px-6">
        {stepIndex && totalSteps && (
          <div className="text-center text-sm text-gray-500 mb-1">Step {stepIndex} of {totalSteps}</div>
        )}
        <h2 className="text-xl font-semibold text-white mb-2 text-center">Create your child's account</h2>
        <p className="text-center text-gray-300 mb-6">After this, you'll set your child's permissions.</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input 
              name="firstName" 
              placeholder="Child's first name" 
              defaultValue={prefillFirstName || ''}
              required 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <input 
              name="lastName" 
              placeholder="Child's last name" 
              defaultValue={prefillLastName || ''}
              required 
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <input
              name="username"
              placeholder="Username for your child"
              defaultValue={suggestedUsername}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              pattern="[a-zA-Z0-9_]+"
              title="Username can only contain letters, numbers, and underscores"
            />
            {suggestedUsername && (
              <p className="text-xs text-gray-500 mt-1">Suggested username based on child's name</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Child's birthdate</label>
            <input
              name="birthdate"
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              max={new Date().toISOString().slice(0,10)}
            />
          </div>
          
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create password for your child"
              defaultValue={generatedPassword}
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="new-password"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="text-sm text-white bg-black p-3 rounded-lg border border-black">
            <p className="font-semibold mb-1 text-white">📝 Important: Save this password</p>
            <p className="text-gray-200">Write down this password to give to {prefillFirstName || 'your child'}. They'll need it to sign in.</p>
            {generatedPassword && (
              <p className="mt-2 text-xs text-gray-300">We've suggested a strong password, but you can change it if you prefer.</p>
            )}
          </div>

          <div className="text-sm text-white bg-black p-3 rounded-lg border border-black">
            <p className="text-gray-200"><strong className="text-white">Note:</strong> Your child will be able to customize their profile (nickname, avatar, etc.) after their account is created.</p>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Creating child account…' : 'Create child account'}
          </button>
        </form>
      </div>
    </div>
  );
}
