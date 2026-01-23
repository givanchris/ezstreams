import { Tv, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <Tv className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Stream<span className="text-gradient">Hub</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground font-medium hover:text-primary transition-colors">
              Discover
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Movies
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Series
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              My List
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="glass" size="sm">
              Sign In
            </Button>
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 glass-card rounded-2xl p-4 animate-scale-in">
            <nav className="flex flex-col gap-3">
              <a href="#" className="text-foreground font-medium py-2">
                Discover
              </a>
              <a href="#" className="text-muted-foreground py-2">
                Movies
              </a>
              <a href="#" className="text-muted-foreground py-2">
                Series
              </a>
              <a href="#" className="text-muted-foreground py-2">
                My List
              </a>
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button variant="glass" size="sm" className="flex-1">
                  Sign In
                </Button>
                <Button variant="hero" size="sm" className="flex-1">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
