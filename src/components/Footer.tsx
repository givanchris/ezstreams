import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">EZ</span>
          </div>
          <span className="font-display font-semibold text-foreground">EZstream</span>
        </div>

        <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} EZstream. All rights reserved.
        </p>
      </div>
      <p className="text-center text-xs text-muted-foreground/70 mt-6">
        As an Amazon Associate, we may earn from qualifying purchases.
      </p>
    </footer>
  );
};

export default Footer;
