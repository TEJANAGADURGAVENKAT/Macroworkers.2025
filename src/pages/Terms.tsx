import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
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
                Terms of Service
              </CardTitle>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                <span className="bg-slate-100 px-3 py-1 rounded-full">
                  <strong>Effective date: October 27, 2025</strong>
                </span>
              </div>
              <Separator className="mt-6" />
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <div className="prose prose-slate max-w-none">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8 rounded-r-lg">
                  <p className="text-slate-700 leading-relaxed mb-0">
                    Welcome to the Macroworkers Service, a web service utility that connects employers and workers on a micro level. 
                    The Macroworkers service is operated by Macroworkers, Inc. and its subsidiaries and affiliates ("us," "we", "Macroworkers", "site" or "Macroworkers.com"). 
                    By using or accessing the Macroworkers Service, you agree that you have read, understand and are bound by these Terms of Use ("Terms"). 
                    We reserve the right, at our sole discretion, to change or delete portions of these Terms at any time without further notice. 
                    Your continued use of the Macroworkers Service after any such changes constitutes your acceptance of the new Terms.
                  </p>
                </div>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    Privacy
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      We care about the privacy of our users and encourage you to read our <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-medium underline">Privacy Policy</a>.
                    </p>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                    Eligibility
                  </h2>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      You may not use the Macroworkers Service if you are under 18 years old.
                    </p>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                    Registration & Account Security
                  </h2>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      When you register for and use the Macroworkers Service, you will be asked to provide information about yourself 
                      (First & Last name, Address, City, Zip code, State, Country, Bank Account Details). Your User Data must be accurate 
                      and current at all times. You are solely responsible for maintaining the security of your account. This means, 
                      for example, that you may not share your password or let anyone else access your account. If you have reason to 
                      believe that your account is no longer secure, please let us know immediately.
                    </p>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                    Prohibited Conduct
                  </h2>
                  <div className="bg-red-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      By using or accessing the Macroworkers Service, you represent, warrant and agree that you will not:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Disable, overburden or impair the proper working of the Macroworkers Service</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Use any robot, spider, scraper or other automated means to access the service</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Send spam or unauthorized advertisements</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Harvest or collect contact information of users</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Solicit private information from users</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Provide false personal information or create multiple accounts</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Submit same job twice using multiple accounts</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Use your profile for commercial purposes</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Use Macroworkers to transfer funds between payment gateways</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Intimidate or harass any user</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Use proxy servers to access the platform</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                          <span className="text-slate-700">Submit false transaction proofs or fraudulent documents</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                    Payment & Transaction Proof Policy
                  </h2>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          Payment Requirements
                        </h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Employers must upload transaction proof documents after making payments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Transaction proofs must clearly show payment details and recipient information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Supported file formats: PDF, images (JPG, PNG)</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verification Process
                        </h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Transaction proofs are stored securely and accessible to workers and administrators</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>Workers can view transaction proofs for their completed payments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                            <span>False or fraudulent transaction proofs will result in immediate account termination</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                    Bank Account Information
                  </h2>
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Required Information</h3>
                        <p className="text-slate-600 text-sm">Account Holder Name, Bank Name, Account Number, IFSC Code, Branch Name, UPI ID</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Security</h3>
                        <p className="text-slate-600 text-sm">All bank information is encrypted and stored securely</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Verification</h3>
                        <p className="text-slate-600 text-sm">Bank account verification is required before payment processing</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-teal-500 rounded-full"></div>
                    User Content & IP Rights
                  </h2>
                  <div className="bg-teal-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Content Guidelines</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Do not start jobs that violate the law or anyone's rights</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Do not post false, misleading or fraudulent information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>Do not post threatening, hateful, or offensive content</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">IP Protection</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>We respect IP rights and prohibit violations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>We promptly remove infringing content upon proper claims</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2"></div>
                            <span>We terminate accounts of repeat infringers</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-pink-500 rounded-full"></div>
                    Dispute Resolution & Liability
                  </h2>
                  <div className="bg-pink-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Dispute Resolution</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>We provide mediation services for user conflicts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>Resolution decisions are binding on all parties</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>Report unfair practices immediately</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Limitation of Liability</h3>
                        <ul className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>We are not responsible for disputes between users</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>Our liability is limited to platform service fees paid</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                            <span>Users interact at their own risk</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
          </section>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-lg mt-10">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">Questions About Our Terms?</h3>
                    <p className="text-slate-300 mb-6">
                      We're here to help clarify any questions about our Terms of Service.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a 
                        href="mailto:support@macroworkers.com" 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Contact Support
                      </a>
                      <a 
                        href="/faq" 
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Read FAQ
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Last updated: October 27, 2025. These terms are subject to change with notice to users.
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    For questions about these Terms: <strong>support@macroworkers.com</strong>
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

export default Terms;