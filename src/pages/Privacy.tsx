import { motion } from "framer-motion";

const Privacy = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              complete tasks, or contact us for support.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email, profile details)</li>
              <li>Task completion data and submitted proof</li>
              <li>Payment and transaction information</li>
              <li>Communication records and support interactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To process payments and prevent fraud</li>
              <li>To communicate with you about your account and tasks</li>
              <li>To improve our platform and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal requirements</li>
              <li>With service providers who assist in platform operations</li>
              <li>In connection with business transfers or acquisitions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Rights</h2>
            <p className="mb-4">
              You have the right to access, update, or delete your personal information. 
              Contact us if you wish to exercise these rights.
            </p>
          </section>

          <section>
            <p className="text-sm italic">
              Last updated: January 2025. We may update this privacy policy from time to time.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Privacy;