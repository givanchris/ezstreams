import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import Footer from "@/components/Footer";

const Terms = () => {
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
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm">Last updated: February 11, 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Service Description</h2>
            <p>
              EZstream is a content discovery platform only. We do not host, stream, or distribute any movies, TV shows, or other media content. Our service helps you find where content is available to watch across various streaming platforms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Third-Party Content</h2>
            <p>
              Content availability information is provided by third-party data sources including TMDB (The Movie Database) and JustWatch. EZstream does not guarantee the accuracy, completeness, or timeliness of this data. Streaming availability may change without notice and varies by region.
            </p>
            <p>
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the service</li>
              <li>Use automated tools to scrape or collect data from the service</li>
              <li>Interfere with or disrupt the service's infrastructure</li>
              <li>Impersonate any person or entity</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Limitation of Liability</h2>
            <p>
              EZstream is provided "as is" without warranties of any kind, either express or implied. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
            </p>
            <p>
              We are not responsible for the content, policies, or practices of any third-party streaming services linked from our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p>
              For questions about these Terms, please contact us at{" "}
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

export default Terms;
