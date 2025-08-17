import { Button } from "@/components/ui/button";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavigationProps {
  onGetStarted: () => void;
}

export default function Navigation({ onGetStarted }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    console.log("Login clicked");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-primary" />
                <div className="text-2xl font-bold text-primary">ProQuote AI</div>
              </div>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex space-x-8">
                <a 
                  href="#features" 
                  className="text-text-secondary hover:text-primary transition-colors font-medium"
                >
                  Features
                </a>
                <a 
                  href="#solutions" 
                  className="text-text-secondary hover:text-primary transition-colors font-medium"
                >
                  Solutions
                </a>
                <a 
                  href="#pricing" 
                  className="text-text-secondary hover:text-primary transition-colors font-medium"
                >
                  Pricing
                </a>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-text-secondary hover:text-primary transition-colors"
              data-testid="button-login"
            >
              Login
            </Button>
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors font-medium"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#features"
              className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#solutions"
              className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Solutions
            </a>
            <a
              href="#pricing"
              className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="w-full justify-start text-text-secondary hover:text-primary mb-2"
                data-testid="button-mobile-login"
              >
                Login
              </Button>
              <Button
                onClick={onGetStarted}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium"
                data-testid="button-mobile-get-started"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
