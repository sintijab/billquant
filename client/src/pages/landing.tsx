import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, 
  Brain, 
  Euro, 
  FileText, 
  Smartphone, 
  TrendingUp, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const handleStartProject = () => {
    setLocation("/project/1");
  };

  const handleGetStarted = () => {
    setLocation("/project/1");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation onGetStarted={handleGetStarted} />
      
      {/* Hero Section */}
      <section className="surface-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-text-primary mb-6 leading-tight">
                AI-Powered Construction{" "}
                <span className="gradient-text">Price Quotation</span>{" "}
                Platform
              </h1>
              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                Create accurate construction proposals in minutes, not hours. Our AI analyzes your site visits and BOQ files to generate professional quotations with precision pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleStartProject}
                  className="btn-primary"
                  data-testid="button-start-project"
                >
                  Start New Project
                </Button>
                <Button 
                  variant="outline" 
                  className="btn-secondary"
                  data-testid="button-watch-demo"
                >
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-text-secondary">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">€2M+</div>
                  <div className="text-sm text-text-secondary">Projects Quoted</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-text-secondary">Contractors</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&h=600" 
                alt="Modern construction professionals using tablets" 
                className="rounded-2xl shadow-2xl animate-scale-in"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success-green rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">AI Processing Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Powerful Features for Construction Professionals
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Everything you need to create accurate, professional construction quotations in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">AI-Powered Analysis</h3>
                <p className="text-text-secondary">
                  Automatically analyze site visits and BOQ files to generate accurate quantity estimates and activity breakdowns.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Euro className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Regional Pricing</h3>
                <p className="text-text-secondary">
                  Access multiple regional price lists including PAT, DEI, and ANAS with automatic price updates and validation.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Professional Documents</h3>
                <p className="text-text-secondary">
                  Generate branded quotations and internal cost analyses with timeline planning and Gantt charts.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Mobile Site Visits</h3>
                <p className="text-text-secondary">
                  Document site conditions with photos, measurements, and notes directly from your mobile device.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Cost Analytics</h3>
                <p className="text-text-secondary">
                  Track project profitability with detailed cost breakdowns, markup analysis, and performance metrics.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Team Collaboration</h3>
                <p className="text-text-secondary">
                  Share projects with team members, collaborate on estimates, and manage approvals in real-time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-text-primary mb-6">
              Trusted by Construction Companies Across Europe
            </h2>
            <p className="text-xl text-text-secondary">
              See how contractors are saving time and winning more projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  "ProQuote AI reduced our quotation time from 8 hours to just 45 minutes. The accuracy is incredible and our clients love the professional documents."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50" 
                    alt="Construction professional" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-text-primary">Marco Bellini</div>
                    <div className="text-sm text-text-secondary">Bellini Costruzioni, Milano</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  "The regional pricing integration is perfect for our multi-region projects. We can compare prices automatically and always select the most competitive option."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50" 
                    alt="Construction manager" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-text-primary">Giuseppe Romano</div>
                    <div className="text-sm text-text-secondary">Romano & Partners, Roma</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-text-secondary mb-4">
                  "Our win rate increased by 40% since we started using ProQuote AI. The professional presentation and accurate pricing give us a huge competitive advantage."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=50&h=50" 
                    alt="Construction company owner" 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-text-primary">Luca Moretti</div>
                    <div className="text-sm text-text-secondary">Moretti Edilizia, Torino</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Quotation Process?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of construction professionals already using ProQuote AI to win more projects and save time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartProject}
              className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all"
              data-testid="button-start-free-trial"
            >
              Start Free Trial
            </Button>
            <Button 
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold transition-all"
              data-testid="button-schedule-demo"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm opacity-75 mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">ProQuote AI</div>
              <p className="text-gray-300 mb-4">
                AI-powered construction quotation platform for modern contractors.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  <Building2 className="h-5 w-5" />
                </a>
              </div>
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
            <p>&copy; 2025 ProQuote AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
