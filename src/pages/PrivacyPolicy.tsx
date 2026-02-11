import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: February 11, 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              EZstream collects minimal information necessary to provide our service. When you create an account, we collect your email address. We also use anonymous analytics to understand how our service is used and to improve the user experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Cookies</h2>
            <p>
              EZstream uses cookies to maintain your session, remember your preferences, and provide a personalized experience. Cookies are small text files stored on your device when you visit our website.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Third-Party Advertising</h2>
            <p>
              Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to EZstream and/or other sites on the Internet.
            </p>
            <p>
              You may opt out of personalized advertising by visiting{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Ads Settings
              </a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Anonymous Analytics</h2>
            <p>
              We use anonymous analytics tools to collect aggregated, non-personally-identifiable information about how visitors use EZstream. This data helps us improve our service and understand usage patterns. No personally identifiable information is shared with analytics providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Amazon Associates</h2>
            <p>
              EZstream is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for us to earn fees by linking to Amazon.com and affiliated sites. As an Amazon Associate, we may earn from qualifying purchases.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Data Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your viewing data and preferences stay private.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@ezstream.app" className="text-primary hover:underline">
                support@ezstream.app
              </a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
