'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface DeclineFeedback {
  primaryReason: string;
  concerns: string[];
  familiarity: string;
  trustLevel: string;
  additionalInfo: string;
  contactPreference: string;
}

export default function InviteDeclinedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<DeclineFeedback>({
    primaryReason: '',
    concerns: [],
    familiarity: '',
    trustLevel: '',
    additionalInfo: '',
    contactPreference: '',
  });
  
  const code = searchParams.get('code');

  const handleConcernChange = (concern: string, checked: boolean) => {
    setFeedback(prev => ({
      ...prev,
      concerns: checked 
        ? [...prev.concerns, concern]
        : prev.concerns.filter(c => c !== concern)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/invite/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          reason: JSON.stringify(feedback),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        console.error('Failed to submit decline feedback');
      }
    } catch (error) {
      console.error('Error submitting decline feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You</h1>
          
          <p className="text-gray-600 mb-6">
            Your feedback has been recorded. We appreciate you taking the time to let us know why you declined the invitation.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              Go to Home Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">You have declined the invitation</h1>
          
          <p className="text-gray-600 mb-6">
            Should you wish your child to join in the future, please request a new invitation from the person who sent the initial invitation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Help us understand your decision</CardTitle>
            <p className="text-sm text-gray-600">Your feedback helps us improve Cliqstr for families</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Reason */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What's the main reason you're declining this invitation?</Label>
                <RadioGroup value={feedback.primaryReason} onValueChange={(value) => setFeedback(prev => ({ ...prev, primaryReason: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unfamiliar" id="unfamiliar" />
                    <Label htmlFor="unfamiliar">I'm not familiar with Cliqstr</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown-person" id="unknown-person" />
                    <Label htmlFor="unknown-person">I don't know the person who invited my child</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-ready" id="not-ready" />
                    <Label htmlFor="not-ready">My child isn't ready for social media yet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="safety-concerns" id="safety-concerns" />
                    <Label htmlFor="safety-concerns">I have safety concerns about online platforms</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="time-constraints" id="time-constraints" />
                    <Label htmlFor="time-constraints">I don't have time to monitor my child's online activity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">Other reason</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Specific Concerns */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What concerns do you have about your child using Cliqstr? (Select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Privacy and data protection',
                    'Online safety and bullying',
                    'Screen time and addiction',
                    'Inappropriate content',
                    'Stranger danger',
                    'Academic performance impact',
                    'Family time disruption',
                    'Cost or subscription fees',
                    'Technical complexity',
                    'Lack of parental control features'
                  ].map((concern) => (
                    <div key={concern} className="flex items-center space-x-2">
                      <Checkbox
                        id={concern}
                        checked={feedback.concerns.includes(concern)}
                        onCheckedChange={(checked) => handleConcernChange(concern, checked as boolean)}
                      />
                      <Label htmlFor={concern} className="text-sm">{concern}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Familiarity with Cliqstr */}
              <div className="space-y-3">
                <Label className="text-base font-medium">How familiar are you with Cliqstr?</Label>
                <RadioGroup value={feedback.familiarity} onValueChange={(value) => setFeedback(prev => ({ ...prev, familiarity: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="never-heard" id="never-heard" />
                    <Label htmlFor="never-heard">Never heard of it before</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="heard-of" id="heard-of" />
                    <Label htmlFor="heard-of">Heard of it but don't know much</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="some-knowledge" id="some-knowledge" />
                    <Label htmlFor="some-knowledge">Know a little about it</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="familiar" id="familiar" />
                    <Label htmlFor="familiar">Familiar with it</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Trust Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">How much do you trust the person who sent this invitation?</Label>
                <RadioGroup value={feedback.trustLevel} onValueChange={(value) => setFeedback(prev => ({ ...prev, trustLevel: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="complete-trust" id="complete-trust" />
                    <Label htmlFor="complete-trust">Complete trust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="some-trust" id="some-trust" />
                    <Label htmlFor="some-trust">Some trust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="little-trust" id="little-trust" />
                    <Label htmlFor="little-trust">Little trust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no-trust" id="no-trust" />
                    <Label htmlFor="no-trust">No trust</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unknown" id="unknown" />
                    <Label htmlFor="unknown">Don't know them</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <Label htmlFor="additionalInfo" className="text-base font-medium">Is there anything else you'd like us to know?</Label>
                <Textarea
                  id="additionalInfo"
                  value={feedback.additionalInfo}
                  onChange={(e) => setFeedback(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  placeholder="Any additional thoughts, suggestions, or concerns..."
                  rows={4}
                />
              </div>

              {/* Contact Preference */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Would you like us to follow up with you?</Label>
                <RadioGroup value={feedback.contactPreference} onValueChange={(value) => setFeedback(prev => ({ ...prev, contactPreference: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes-email" id="yes-email" />
                    <Label htmlFor="yes-email">Yes, send me more information via email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes-call" id="yes-call" />
                    <Label htmlFor="yes-call">Yes, I'd like a phone call</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no-contact" id="no-contact" />
                    <Label htmlFor="no-contact">No, please don't contact me</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !feedback.primaryReason}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Skip
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}