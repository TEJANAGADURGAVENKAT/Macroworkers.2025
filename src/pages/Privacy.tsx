import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
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
                Privacy Policy
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
                    By using or accessing the Macroworkers Service, you agree that you have read, understand and are bound by our Privacy Policy. 
                    We reserve the right, at our sole discretion, to change or delete portions of this Privacy Policy at any time without further notice. 
                    Your continued use of the Macroworkers Service after any such changes constitutes your acceptance of the new Privacy Policy.
                  </p>
                </div>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    Macroworkers Principles
                  </h2>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We are committed to making it easy to advertise products, find people to promote websites, find people to do work, and convert work into earnings. 
                      We ensure that your personal information is hidden from other users, except for Macroworkers ID, IP Address, and browser information. 
                      Macroworkers does not share information with other users.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      We advise employers and workers not to share personal information (MSN ID, Skype ID, Email, phone number) as communication is based on user ID. 
                      Please report campaigns/jobs that ask for personal or credit card information, as this violates our principles.
                    </p>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                    Safe Use of Macroworkers
                  </h2>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed">
                      Our platform is suitable for users of all backgrounds. We advise against accepting offensive or disturbing jobs, especially for children under 21 
                      or those offended by adult material. Job details should be clear and transparent. If a job is not suitable for you, other jobs are available.
                    </p>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                    The Information We Collect
                  </h2>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We collect personal information you knowingly choose to disclose and website use information collected by us as you interact with our website. 
                      This includes:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Personal Information:</strong>
                            <p className="text-slate-600 text-sm">Name, email, address, phone number, bank account details</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Account Information:</strong>
                            <p className="text-slate-600 text-sm">User ID, IP address, browser information, login times</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Task Data:</strong>
                            <p className="text-slate-600 text-sm">Task descriptions, submissions, completion status, ratings</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Payment Information:</strong>
                            <p className="text-slate-600 text-sm">Transaction amounts, payment history, bank account details</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Transaction Proofs:</strong>
                            <p className="text-slate-600 text-sm">Uploaded documents, file metadata, verification status</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Communication Data:</strong>
                            <p className="text-slate-600 text-sm">Messages between users, support interactions</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <strong className="text-slate-800">Usage Data:</strong>
                            <p className="text-slate-600 text-sm">Platform interactions, feature usage, performance metrics</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                    How We Use Your Information
                  </h2>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We use your information to provide and improve our services:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <span className="text-slate-700"><strong>Service Delivery:</strong> Connecting employers with workers, processing payments</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          <span className="text-slate-700"><strong>Account Management:</strong> Creating and maintaining user accounts, verification</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                          <span className="text-slate-700"><strong>Payment Processing:</strong> Facilitating transactions, verifying payment proofs</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">4</span>
                          </div>
                          <span className="text-slate-700"><strong>Communication:</strong> Sending notifications, updates, support messages</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">5</span>
                          </div>
                          <span className="text-slate-700"><strong>Security:</strong> Protecting against fraud, unauthorized access, abuse</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">6</span>
                          </div>
                          <span className="text-slate-700"><strong>Compliance:</strong> Meeting legal obligations, regulatory requirements</span>
                        </div>
                      </div>
                    </div>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-red-500 rounded-full"></div>
                    Data Security
                  </h2>
                  <div className="bg-red-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      We implement comprehensive security measures to protect your personal information:
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Encryption</h3>
                        <p className="text-slate-600 text-sm">All sensitive data is encrypted using industry standards</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Secure Storage</h3>
                        <p className="text-slate-600 text-sm">Data stored in secure cloud infrastructure (Supabase)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-2">Access Control</h3>
                        <p className="text-slate-600 text-sm">Row Level Security (RLS) protects user data</p>
                      </div>
                    </div>
                  </div>
          </section>

                <section className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                    Your Rights
                  </h2>
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <p className="text-slate-700 leading-relaxed mb-4">
                      You have the following rights regarding your personal information:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Access:</strong> Request access to your personal data</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Correction:</strong> Update or correct your information</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Deletion:</strong> Request deletion of your data</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Portability:</strong> Export your data in a portable format</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Opt-out:</strong> Unsubscribe from marketing communications</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-slate-700"><strong>Restriction:</strong> Request restriction of processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
          </section>

                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-lg mt-10">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4">Questions About Privacy?</h3>
                    <p className="text-slate-300 mb-6">
                      We're committed to protecting your privacy and being transparent about our practices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a 
                        href="mailto:privacy@macroworkers.com" 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Contact Privacy Team
                      </a>
                      <a 
                        href="/terms" 
                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Read Terms of Service
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8 pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Last updated: October 27, 2025. We may update this privacy policy from time to time.
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

export default Privacy;