import { motion } from "framer-motion";

const Terms = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Macroworkers, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Employees/Workers must complete tasks according to provided specifications</li>
              <li>Employers must provide clear, achievable task requirements</li>
              <li>All users must maintain respectful communication</li>
              <li>Fraudulent activity or manipulation is strictly prohibited</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Payment Terms</h2>
            <p className="mb-4">
              Payments are processed securely through our platform. Employees/Workers are paid upon task approval by employers. 
              Platform fees are clearly disclosed before task posting or completion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Platform Usage</h2>
            <p className="mb-4">
              Macroworkers reserves the right to suspend or terminate accounts that violate these terms. 
              We maintain the right to moderate content and resolve disputes at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              Macroworkers provides the platform "as is" and makes no warranties regarding the completion 
              or quality of tasks performed by users.
            </p>
          </section>

          <section>
            <p className="text-sm italic">
              Last updated: January 2025. These terms are subject to change with notice to users.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default Terms;