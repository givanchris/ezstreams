import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import Footer from "@/components/Footer";

const Contact = () => {
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
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Contact Us
          </h1>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6">
          <p className="text-muted-foreground">
            Have a question, feedback, or need support? We'd love to hear from you.
          </p>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email us at</p>
              <a
                href="mailto:support@ezstream.app"
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                support@ezstream.app
              </a>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            We typically respond within 24–48 hours. For general inquiries about content availability, please note that streaming data is provided by third-party sources and may not always reflect real-time changes.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
