import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-4xl font-bold text-slate-800 mb-4">
                FAQ (Frequently Asked Questions)
              </CardTitle>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                  Detailed Dos and Don'ts for both Employers and Workers is available in Macroworkers Guidelines page.
                </span>
              </div>
              <Separator className="mt-6" />
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="prose prose-slate max-w-none">
                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    What is Macroworkers?
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      Macroworkers is an innovative, International online platform that connects Employers and Workers from around the world. 
                      Tasks are simple and quick, called "microjobs," including data mining, data categorization, data tagging, data labeling, 
                      data matching, sentiment analysis, event sequencing, transcription, content comparison, content evaluation, surveys, 
                      research studies, application testing, web development, content creation, and digital marketing tasks. 
                      Joining Macroworkers is free and open to anyone internationally.
                    </p>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                    Who are the Employers?
                  </h2>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      Anyone can be an Employer. Whether you own an online business, a blog, a video channel, or need referrals, 
                      you can have your small tasks assigned to tens of thousands of active Workers. Employers can post tasks, 
                      assign workers, make payments, and upload transaction proofs for verification. The platform helps with 
                      website traffic, comments, likes, and application testing.
                    </p>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                    Who are the Workers?
                  </h2>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      Anyone can also be a Worker. Whether you're a stay-at-home mom, a student who needs extra spending money, 
                      or simply love helping others while making some extra cash, you can complete microtasks and earn money. 
                      Workers can browse tasks, complete assignments, receive payments, and view transaction proofs.
                    </p>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                    Payment System & Transaction Proofs
                  </h2>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          How Payment Works
                        </h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Employers make payments directly to worker bank accounts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>After payment, employers must upload transaction proof documents</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Workers can view these proofs to verify payments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Payment processing takes 3-5 business days after transaction proof upload</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Transaction Proofs
                        </h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Documents showing payment was made to worker's bank account</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Can be screenshots, receipts, or bank statements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Stored securely and accessible to workers, employers, and administrators</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Supported formats: PDF, JPG, PNG (max 10MB)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                    Account Setup & Security
                  </h2>
                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Bank Account Setup</h3>
                        <p className="text-slate-600 text-sm">Go to "Bank Details" and enter accurate information including Account Holder Name, Bank Name, Account Number, IFSC Code, Branch Name, and UPI ID</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Security</h3>
                        <p className="text-slate-600 text-sm">All bank details are encrypted using industry-standard methods and stored securely. Only you and authorized administrators can access your banking information</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Verification</h3>
                        <p className="text-slate-600 text-sm">Bank account verification is required before payment processing. Bank account verification may take additional time for new accounts</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                    Common Questions & Support
                  </h2>
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">Can I have Multiple Accounts?</h4>
                          <p className="text-slate-600 text-sm">No, one person can only maintain one account. Multiple accounts will result in immediate termination of all accounts. This policy helps maintain platform integrity and prevents fraud.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">How do I resolve Payment Disputes?</h4>
                          <p className="text-slate-600 text-sm">Contact support within 30 days of the issue. Provide evidence and we will mediate the dispute. All transaction proofs are stored for reference during disputes.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">What happens if my Account is Suspended?</h4>
                          <p className="text-slate-600 text-sm">Contact support to understand the reason for suspension. Common reasons include Terms violations, false transaction proofs, or security concerns.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">How do I contact Customer Support?</h4>
                          <p className="text-slate-600 text-sm">Email support@macroworkers.com or use the contact form on our website. We respond within 24 hours during business days. For technical issues, contact tech@macroworkers.com.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">What if I forget my Password?</h4>
                          <p className="text-slate-600 text-sm">Click "Forgot Password" on the login page, enter your email, and follow the reset instructions sent to your email. Password reset links are valid for 24 hours for security purposes.</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-slate-800 mb-2">Can I get a Refund?</h4>
                          <p className="text-slate-600 text-sm">Refunds are subject to our refund policy. Contact support for refund requests. Unused credits may be refundable with applicable withdrawal fees. All refund requests must be made within 1 year of deposit.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
                    Platform Features & Usage
                  </h2>
                  <div className="bg-teal-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Account Management</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Update profile information in account settings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Bank details changes require re-verification</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>View payment history and transaction proofs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Track task progress and status updates</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Communication & Support</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Use platform's messaging system for task-related communication</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>All communications are logged for dispute resolution</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Contact support for technical issues or questions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Platform maintenance is usually scheduled during off-peak hours</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-lg mt-10">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">Still Have Questions?</h3>
                    <p className="text-slate-300 mb-6">
                      We're here to help! Contact our support team for any additional questions not covered in this FAQ.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a 
                        href="mailto:support@macroworkers.com" 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Contact Support
                      </a>
                      <a 
                        href="/terms" 
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Read Terms of Service
                      </a>
                      <a 
                        href="/privacy" 
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Read Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    For additional questions not covered here, please contact us at: <strong>support@macroworkers.com</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
