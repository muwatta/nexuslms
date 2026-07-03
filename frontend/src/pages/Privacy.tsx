// frontend/src/pages/Privacy.tsx
import React from "react";
import Layout from "../components/Layout";
import { Shield, Lock, Eye, Database } from "lucide-react";

const Privacy: React.FC = () => {
  return (
    <Layout showBackButton backTo="/" showNextButton nextTo="/signup">
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Privacy Policy
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  How we protect your data
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Data Collection
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  We collect minimal data necessary to provide our educational
                  services. This includes your name, email, academic progress,
                  and learning preferences. All data is encrypted and stored
                  securely.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Data Security
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  We implement industry-standard security measures including SSL
                  encryption, secure password hashing, and regular security
                  audits. Your passwords are never stored in plain text.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Your Rights
                  </h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  You have the right to access, modify, or delete your personal
                  data at any time. Contact our support team for data-related
                  requests.
                </p>
              </section>

              <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Last updated: March 2026. For questions about this policy,
                  contact us at privacy@muwata.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
