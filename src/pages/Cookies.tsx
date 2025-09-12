import { motion } from "framer-motion";

const Cookies = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and analyzing site usage.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-2">Essential Cookies</h3>
              <p className="mb-2">
                These cookies are necessary for the website to function properly and cannot be disabled.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Load balancing and site functionality</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-2">Analytics Cookies</h3>
              <p className="mb-2">
                Help us understand how visitors interact with our website.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Page views and user behavior tracking</li>
                <li>Performance monitoring</li>
                <li>Error reporting and debugging</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-2">Preference Cookies</h3>
              <p className="mb-2">
                Remember your choices and provide personalized features.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Language and region preferences</li>
                <li>Theme and display settings</li>
                <li>Form data and user preferences</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Managing Cookies</h2>
            <p className="mb-4">
              You can control and manage cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View cookies stored on your device</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block cookies from specific sites</li>
              <li>Set preferences for cookie acceptance</li>
            </ul>
            <p className="mt-4">
              Note that disabling certain cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
            <p className="mb-4">
              Some cookies may be set by third-party services we use, such as payment processors 
              or analytics providers. These have their own privacy policies and cookie practices.
            </p>
          </section>

          <section>
            <p className="text-sm italic">
              Last updated: January 2025. This cookie policy may be updated to reflect changes in our practices.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Cookies;