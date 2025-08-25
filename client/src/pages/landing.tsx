import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { checkAllHealth } from "../features/endpoints/healthCheck";
import { useLocation } from "wouter";
// Navigation/Header styled like Chakra example
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

import {
  Brain,
  Euro,
  Smartphone,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AppDispatch } from "@/store";
export default function LandingPage() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(checkAllHealth());
  }, [dispatch]);
  const [, setLocation] = useLocation();

  // Features for new section
  const features = [
    {
      title: 'On-site Inspection',
      desc: 'Create price proposals on-site during the site visit. Fast-forward construction planning with AI and visual introspection.',
      img: 'https://images.ctfassets.net/fqtbha7ac6p4/4CVEovT1wFr0EMk0u4H92L/5b03570f24b33955fa51775a28c2fb2b/Inpections_with_Fieldwire.jpg',
    },
    {
      title: 'Cost Saving',
      desc: 'Integrate BOQs, pricing schedules, and real-time cost data for precise, error-free proposals.',
      img: 'https://img.freepik.com/free-photo/construction-plans-with-yellow-helmet-drawing-tools-bluep_1232-1726.jpg?semt=ais_hybrid&w=740&q=80',
    },
    {
      title: 'Smart Analytics',
      desc: 'Compare the pricing and construction standard across local regions and analyze win rates to improve your bidding strategy.',
      img: 'https://vercida-prod-public.s3.eu-west-2.amazonaws.com/images/23/Construction%20industry.jpg',
    },
  ];

  // Content for horizontal slider
  const sliderSections = [
    {
      title: "How AI is Transforming Construction?",
      content: (
        <>
          AI-Powered Quotation is the next evolution in the construction industry. It’s a collaborative process that leverages advanced technology and data to streamline project estimation, reduce costs, and improve efficiency for all stakeholders—whether you’re working on residential, commercial, or infrastructure projects.<br /><br />
          Unlike traditional workflows that rely on disconnected files and manual updates, our AI-driven approach keeps your project data dynamic, synchronized, and always up to date.
        </>
      ),
      bg: '/bim1.jpeg',
    },
    {
      title: "Benefits of AI Price Quotation",
      content: (
        <p className="text-lg text-text-secondary text-center mb-6">
          BillQuant delivers faster, more accurate, and collaborative construction proposals. Enjoy streamlined workflows, reduced risk, and higher quality outcomes for every project.
        </p>
      ),
      bg: '/bim2.jpg',
    },
    {
      title: "How Does It Work?",
      content: (
        <>
          Our AI Price Quotation tool connects people, technology, and processes to deliver better results in construction planning and execution. By integrating your BOQs, site data, and pricing schedules, it provides a single source of truth for your project—making your workflow more dynamic, collaborative, and efficient.
        </>
      ),
      bg: '/bim3.jpeg',
    },
  ];

  const [sliderIndex, setSliderIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = (idx: number) => {
    if (idx === sliderIndex) return;
    setDirection(idx > sliderIndex ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setSliderIndex(idx);
      setAnimating(false);
    }, 300);
  };

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDirection(1);
      setAnimating(true);
      setTimeout(() => {
        setSliderIndex((prev) => (prev + 1) % sliderSections.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sliderIndex, sliderSections.length]);


  const handleStartProject = () => {
    setLocation("/project/1");
  };

  const handleGetStarted = () => {
    setLocation("/project/1");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full px-8 flex items-center justify-between bg-white/80 shadow-sm sticky top-0 z-30 font-graphik-regular">
        <div className="flex items-center m-0 py-5">
          <img src="/european_management.png" alt="European Management Logo" width="120px" />
          <img src="/billquant_logo.png" alt="BillQuant Logo" width="170px" />
        </div>
        <nav>
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-10 hero-section font-graphik-light">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-graphik-semibold text-[#071330] mb-6" style={{ lineHeight: 1.25 }}>
              Create Construction Proposal in Seconds
            </h1>
            <p className="text-xl text-[#444] mb-8 max-w-xl font-graphik-regular">
              BillQuant empowers construction professionals to generate accurate, professional, and customizable price quotations—fast. Save time, win more projects, and impress your clients with beautiful, data-driven proposals.
            </p>
            <div className="flex gap-4 mb-8">
              <SignedIn>
                <button onClick={handleGetStarted} className="bg-[#f9a825] text-[#071330] px-8 py-3 rounded-lg font-graphik-bold text-lg shadow-md hover:bg-[#ffd95a] transition">Start Quotation</button>
              </SignedIn>
              <SignedOut>
                <div className="md:inline-block">
                  <SignInButton mode="modal"
                    className="bg-[#071330] text-white px-8 py-3 rounded-lg font-graphik-bold text-lg shadow-md hover:bg-[#163b7c] transition ml-0"
                  >Get started</SignInButton>
                </div>
              </SignedOut>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col items-start">
                <span className="text-3xl font-graphik-bold text-[#071330]">50%</span>
                <span className="text-sm text-[#444] font-graphik-light">Less time building proposals</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-3xl font-graphik-bold text-[#071330]">95%</span>
                <span className="text-sm text-[#444] font-graphik-light">Time saved on admin</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-3xl font-graphik-bold text-[#071330]">2M+</span>
                <span className="text-sm text-[#444] font-graphik-light">Projects quoted</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/preview.jpg"
              alt="BillQuant UI"
              className="rounded-2xl shadow-2xl border-4 border-white w-full max-w-lg"
            />
          </div>
        </div>
      </section>
            <section className=" mx-auto lg:py-20 font-graphik-light" id="how-it-works">
        <div className="flex flex-col md:flex-row items-center gap-12 justify-center">
        <nav className="hidden md:flex font-graphik-semibold mt-0 w-screen left-1/2 right-1/2 relative " style={{transform: 'translateX(-50%)'}}>
          <ul className="flex gap-20 w-full justify-center items-center from-primary to-primary-dark h-14 px-8 shadow-lg text-white">
            <li className="h-full flex items-center bg-white rounded-lg">
              <a href="#features" className="px-8 py-4 rounded-lg transition-all duration-200 text-primary h-full flex items-center text-lg hover:underline focus:underline">Features</a>
            </li>
            <li className="h-full flex items-center rounded-lg">
              <a href="#how-it-works" className="px-8 py-4 rounded-lg transition-all duration-200 text-primary h-full flex items-center text-lg hover:underline focus:underline">How it Works</a>
            </li>
            <li className="h-full flex items-centerrounded-lg">
              <a href="#contact" className="px-8 py-4 rounded-lg transition-all duration-200 text-primary h-full flex items-center text-lg hover:underline focus:underline">Contact</a>
            </li>
          </ul>
        </nav>
          </div>
          </section>
                {/* Features Section */}
      <section id="features" className="lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Why BillQuant?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f) => (
              <div key={f.title} className="bg-[#f5f7fa] rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow duration-200 flex flex-col h-full">
                <h3 className="text-lg font-semibold text-[#071330] mb-3">{f.title}</h3>
                <p className="text-[#444] mb-4">{f.desc}</p>
                <div className="mt-auto">
                  <img src={f.img} alt={f.title} className="rounded-lg shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* Features Section */}

      <section id="features" className="lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Features of software
            </h2>
          </div>
          <ul className="flex flex-row flex-wrap gap-x-8 gap-y-6 max-w-8xl mx-auto justify-center">
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <Brain className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Accurate Cost Forecasting</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">All project elements are determined with greater precision, making cost predictions more realistic and reliable.</span>
            </li>
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Optimized Planning</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">Rapid analysis and smart suggestions help you optimize your project before work begins, reducing errors and rework.</span>
            </li>
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <Users className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Real-Time Collaboration</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">Share and update project information with your team and partners, ensuring everyone is always on the same page.</span>
            </li>
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <Euro className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Material Control</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">Get better control over material quantities and costs, reducing waste and saving money.</span>
            </li>
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <Smartphone className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Predictive Maintenance</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">Use data-driven insights to plan maintenance and monitor project health even after completion.</span>
            </li>
            <li className="flex flex-col items-start md:items-center py-2 w-full md:w-1/4">
              <div className="flex items-center gap-4">
                <Star className="h-7 w-7 text-[#071330] flex-shrink-0" />
                <span className="text-lg text-[#071330] font-semibold text-left md:text-center">Cahflow control</span>
              </div>
              <span className="text-[#444] mt-2 text-justify">Reduce installation errors and material waste, cutting both costs and delivery times.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* AI Quotation & BIM-Inspired Benefits Horizontal Slider */}
      <div className="relative overflow-hidden">
        {/* Background fade transition */}
        <div
          key={sliderIndex}
          className={`w-full absolute left-0 top-0 z-0 transition-all duration-[1200ms] ${animating ? 'opacity-0 blur-md' : 'opacity-100 blur-none'}`}
          style={{
            height: '540px',
            background: `linear-gradient(rgba(248,250,252,0.52), rgba(248,250,252,0.82)), url(${sliderSections[sliderIndex].bg}) center/cover no-repeat`,
            transition: 'background-image 1.2s, filter 1.2s, opacity 1.2s',
          }}
        />
        <section
          className="relative w-full z-10"
          style={{ minHeight: '540px', display: 'flex', alignItems: 'center' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-2xl min-h-[220px] flex flex-col items-center justify-center relative overflow-hidden">
                <div
                  key={sliderIndex}
                  className={`bg-white bg-opacity-95 rounded-2xl shadow-xl px-8 py-10 w-full transition-all duration-[1200ms]
                      ${animating ? 'translate-y-16 opacity-0' : 'translate-y-0 opacity-100'}
                    `}
                  style={{
                    willChange: 'transform, opacity',
                  }}
                >
                  <h2 className="text-3xl font-bold text-text-primary mb-6 text-center">{sliderSections[sliderIndex].title}</h2>
                  <div className="text-lg text-text-secondary text-center mb-6 text-justify">
                    {sliderSections[sliderIndex].content}
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-center items-center gap-3 mt-2">
                {sliderSections.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-3 h-3 rounded-full border-2 ${sliderIndex === idx ? 'bg-[#1a4ca3] border-[#1a4ca3]' : 'bg-white border-[#1a4ca3]'} transition-all`}
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => goTo(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Quotation?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of construction professionals already using BillQuant to win more projects and save time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="border-2 border-white text-primary hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold transition-all"
              data-testid="button-schedule-demo"
            >
              Contact us
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">BillQuant</div>
              <p className="text-gray-300 mb-4">
                AI-powered construction quotation platform for modern contractors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-300">
            <p>All rights reserved by European Management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
