'use client';

import { useState } from 'react';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "What is Cliqstr?",
      answer: "Cliqstr is a family-first, ad-free social platform designed for privacy, safety, and community. It gives children a safe space to connect while ensuring parents remain in control."
    },
    {
      question: "How do children join?",
      answer: "Children cannot sign up alone. A parent must approve their account and verify adulthood with a credit card. All permissions and activity oversight happen in the Parents HQ dashboard."
    },
    {
      question: "How does moderation work?",
      answer: "Cliqstr's moderation team currently consists of verified internal members of our founding team. As we grow, we plan to introduce third-party background screening for all moderators to ensure ongoing trust and safety."
    },
    {
      question: "What happens if a child breaks the rules?",
      answer: "Cliqstr uses a strike-based system. Multiple confirmed violations can lead to suspension or removal. Parents are informed whenever their child's account is flagged."
    },
    {
      question: "What is a Red Alert?",
      answer: "A Red Alert is triggered when a child encounters or reports a high-risk situation (e.g., threats, self-harm, grooming attempts). Parents are always notified immediately—they are full partners in keeping their children safe."
    },
    {
      question: "Can children access public groups?",
      answer: "Children may access age-appropriate public cliqs if permitted by their designated parent/guardian. Parents can control this permission in their Parent HQ dashboard."
    },
    {
      question: "Is homework help safe?",
      answer: "Yes. Our Homework Help feature is under development and will use AI for academic support only, with filters blocking unsafe conversations. Human oversight is planned as funding allows."
    },
    {
      question: "How are complex family safeguards addressed?",
      answer: "Cliqstr has developed safeguards to support families in diverse situations -- including shared custody and guardianship. The current system allows multiple approved parents or guardians to oversee a child's account through Parent HQ. Future updates will expand protections for verified custody and abuse-sensitive cases in collaboration with legal and child-safety advisors. If you have a unique or special-needs situation, please email support@cliqstr.com"
    }
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h1>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openItems.includes(index) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}



