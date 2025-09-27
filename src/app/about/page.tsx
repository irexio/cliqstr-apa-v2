export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">About Us</h1>
      
      <div className="space-y-8">
        {/* Main Introduction */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 leading-relaxed text-base">
            Cliqstr is a family-first, ad-free, algorithm-free social platform created to give families, children, and trusted groups a safe and private place to connect online. Unlike mainstream social media, Cliqstr was designed from the ground up for privacy, parental partnership, and healthier conversations.
          </p>
        </div>

        {/* What Sets Us Apart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What sets Cliqstr apart:</h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">No advertising or data harvesting</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">No direct messages or contact scraping</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">No location tracking</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">No manipulative algorithms</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">Mandatory adult approval for all users under 18</span>
            </li>
            <li className="flex items-start">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              <span className="text-gray-600 text-base">A Parents HQ dashboard for managing permissions, invites, and receiving Red Alert notifications</span>
            </li>
          </ul>
        </div>

        {/* Mission Statement */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600 leading-relaxed text-base">
            Cliqstr's mission is to replace conflict and unsafe shortcuts with a third option: a safe, legal, and fun digital home — for families, and for anyone interested in a better way to socialize online.
          </p>
        </div>

        {/* Looking Ahead */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Looking Ahead</h2>
          <p className="text-gray-600 leading-relaxed text-base">
            Some features, such as Homework Helpline and CliqSafe, are part of Cliqstr's long-term roadmap. These will be introduced in the future as funding and development allow. For now, our focus remains on building the most secure, fun, and family-centered online platform possible.
          </p>
        </div>
      </div>
    </main>
  );
}
