'use client';

import { useState } from 'react';
import PasswordInput from '@/components/ui/PasswordInput';

export default function PasswordClient({ userEmail }: { userEmail: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!(/(?=.*[A-Z])/.test(password))) return 'Password must contain at least one uppercase letter';
    if (!(/(?=.*\d)/.test(password))) return 'Password must contain at least one number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Debug logging to help identify the issue
    console.log('🔐 [CHANGE-PASSWORD] Form submission:', {
      newPassword: newPassword,
      confirmPassword: confirmPassword,
      newPasswordLength: newPassword.length,
      confirmPasswordLength: confirmPassword.length,
      passwordsMatch: newPassword === confirmPassword
    });

    if (newPassword !== confirmPassword) {
      setError(`New passwords do not match. New: "${newPassword}" | Confirm: "${confirmPassword}"`);
      setLoading(false);
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="text-gray-600 mt-2">Update your account password. Choose a strong password to keep your account secure.</p>
        </div>

        {message && <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-md mb-6">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Email</label>
            <input type="email" value={userEmail} disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              required
            />
            <div className="mt-2 text-sm text-gray-600">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
            />
            {newPassword && confirmPassword && (
              <div className="mt-1 text-sm">
                {newPassword === confirmPassword ? (
                  <span className="text-green-600">✓ Passwords match</span>
                ) : (
                  <span className="text-red-600">✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">{loading ? 'Updating...' : 'Change Password'}</button>
            <a href="/account" className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  );
}


