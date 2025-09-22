export default function HowItWorksPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h1>
      
      <div className="space-y-8">
        {/* Cliqs and Explore */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliqs and Explore</h2>
          <p className="text-gray-600 leading-relaxed">
            When you join Cliqstr, you can create cliqs — private or shared spaces for conversations, photos, and activities. Depending on your plan, you can run multiple cliqs at the same time.
          </p>
        </div>

        {/* Private Cliqs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Private Cliqs</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Invite-only and not visible in Explore.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Great for immediate family or small, trusted groups.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Example: one cliq just for your household, another for extended family with aunts, uncles, and cousins.</span>
            </li>
          </ul>
        </div>

        {/* Semi-Private Cliqs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Semi-Private Cliqs</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Visible in Explore, but entry requires approval.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">The cliq owner reviews and approves requests.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Example: wedding planning, remembering a loved one, or a school event group.</span>
            </li>
          </ul>
        </div>

        {/* Public Cliqs */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Cliqs</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Visible in Explore and discoverable by Cliqstr members.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Anyone can request to join, but they must be age-appropriate.</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600">Example: book clubs, gardening groups, photography circles, or tech discussions.</span>
            </li>
          </ul>
        </div>

        {/* Important Difference */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Difference</h2>
          <p className="text-gray-600 leading-relaxed">
            Even public cliqs on Cliqstr are not open to the wider internet. They can be explored and discovered inside Cliqstr, and a sampling may appear on the homepage — but to see inside and participate, you must join first.
          </p>
        </div>

        {/* Note to Parents */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Note to Parents</h2>
          <p className="text-gray-600 leading-relaxed">
            We want to create a safe and fun place for your child. Getting started might feel confusing at first, so we recommend that you help your child set up their account. Step-by-step instructions are included in the Parent HQ Page, which you'll see at sign up.
          </p>
        </div>
      </div>
    </main>
  );
}
