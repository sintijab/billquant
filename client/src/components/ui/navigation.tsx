import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
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
    <header className="w-full px-8 flex items-center justify-between bg-white/80 shadow-sm sticky top-0 z-30 font-graphik-regular">
      <div className="flex items-center m-0 py-5">
        <img src="/european_management.png" alt="European Management Logo" width="120px" />
        <img src="/billquant_logo.png" alt="BillQuant Logo" width="170px" />
      </div>
      <nav>
        <SignedOut><SignUpButton mode="modal" /><div className="hidden md:inline-block bg-[#071330] text-white px-6 py-2 rounded-lg font-graphik-bold shadow-md hover:bg-[#163b7c] transition ml-5"><SignInButton mode="modal" /></div></SignedOut>
          <SignedIn>
            <span className="md:hidden sm:inline-block ml-2 align-middle">
            <UserButton showName={false} />
            </span>
            <span className="hidden md:inline-block ml-2 align-middle">
              <UserButton showName={true} />
            </span>
        </SignedIn>
       </nav>
    </header>
  );
}
