import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gradient-to-b from-white to-gray-50">
        <div className="fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent">
            floxide.io
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-700 mb-8">The Future of Infrastructure Management</h2>
          <p className="max-w-2xl text-lg mb-10 text-gray-600">
            Transform your cloud infrastructure with AI-powered automation and visual interfaces.
            Enterprise-grade IaC that makes complex deployments accessible to everyone.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-orange-300 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-400 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
            >
              Get Started
            </Link>
            <Link
              className="rounded-lg border-2 border-orange-300 text-orange-400 px-6 py-3 text-sm font-semibold hover:bg-orange-50 transition-colors duration-200"
              href="#features"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </header>

      {/* Trusted By Section */}
      <section className="py-12 px-4 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500 text-sm mb-8">TRUSTED BY INNOVATIVE COMPANIES</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-75">
            <Image src="/logos/aws.svg" alt="AWS" width={120} height={40} className="h-8 w-auto" />
            <Image src="/logos/google.svg" alt="Google Cloud" width={120} height={40} className="h-8 w-auto" />
            <Image src="/logos/microsoft.svg" alt="Microsoft Azure" width={120} height={40} className="h-8 w-auto" />
            <Image src="/logos/digitalocean.svg" alt="DigitalOcean" width={120} height={40} className="h-8 w-auto" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Modern Infrastructure</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors duration-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Infrastructure Design</h3>
              <p className="text-gray-600">Design and manage your cloud infrastructure through an intuitive visual interface.</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors duration-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Automation</h3>
              <p className="text-gray-600">Leverage AI to automate infrastructure deployment and management tasks.</p>
            </div>
            <div className="p-6 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors duration-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">Built-in security features and compliance controls for enterprise environments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Real-World Use Cases</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Enterprise Migration</h3>
              </div>
              <p className="text-gray-600 mb-4">A Fortune 500 company successfully migrated their entire infrastructure to the cloud in just 3 months, reducing operational costs by 40%.</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Zero downtime during migration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Automated compliance checks
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time cost optimization
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Startup Scaling</h3>
              </div>
              <p className="text-gray-600 mb-4">A fast-growing startup scaled their infrastructure from 0 to 1M users in 6 months, maintaining 99.99% uptime throughout their growth.</p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Automatic scaling capabilities
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Cost-effective resource allocation
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time performance monitoring
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">Choose the plan that best fits your needs. All plans include our core features.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-orange-200 transition-colors duration-200">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-gray-600 mb-4">Perfect for small teams and startups</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 5 team members
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Basic infrastructure templates
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Email support
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-orange-300 text-white rounded-lg hover:bg-orange-400 transition-colors duration-200">
                Get Started
              </button>
            </div>

            {/* Professional Plan */}
            <div className="bg-white p-8 rounded-xl border-2 border-orange-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-300 text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <p className="text-gray-600 mb-4">Ideal for growing businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 20 team members
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced infrastructure templates
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Custom integrations
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-orange-300 text-white rounded-lg hover:bg-orange-400 transition-colors duration-200">
                Get Started
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-orange-200 transition-colors duration-200">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-4">For large organizations</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited team members
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Custom infrastructure solutions
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 dedicated support
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  SLA guarantees
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-orange-300 text-white rounded-lg hover:bg-orange-400 transition-colors duration-200">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">99.9%</div>
              <p className="text-gray-600">Uptime Guarantee</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">500+</div>
              <p className="text-gray-600">Active Customers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">40%</div>
              <p className="text-gray-600">Cost Reduction</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-400 mb-2">24/7</div>
              <p className="text-gray-600">Support Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 font-semibold">JD</span>
                </div>
                <div>
                  <h4 className="font-semibold">John Doe</h4>
                  <p className="text-sm text-gray-500">CTO, TechCorp</p>
                </div>
              </div>
              <p className="text-gray-600">"floxide.io has revolutionized how we manage our cloud infrastructure. The visual interface and AI automation have saved us countless hours."</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 font-semibold">AS</span>
                </div>
                <div>
                  <h4 className="font-semibold">Alice Smith</h4>
                  <p className="text-sm text-gray-500">DevOps Lead, StartupX</p>
                </div>
              </div>
              <p className="text-gray-600">"The automation capabilities are incredible. We've reduced our deployment time by 70% and eliminated human error in our infrastructure management."</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 font-semibold">RJ</span>
                </div>
                <div>
                  <h4 className="font-semibold">Robert Johnson</h4>
                  <p className="text-sm text-gray-500">Infrastructure Manager, EnterpriseCo</p>
                </div>
              </div>
              <p className="text-gray-600">"The enterprise-grade security features and compliance controls have made it easy for us to maintain our strict security standards."</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-3">How does floxide.io handle security?</h3>
              <p className="text-gray-600">We implement enterprise-grade security measures including encryption at rest and in transit, role-based access control, and regular security audits.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-3">Can I integrate with my existing tools?</h3>
              <p className="text-gray-600">Yes, floxide.io offers seamless integration with popular CI/CD tools, monitoring systems, and cloud providers through our comprehensive API.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-3">What kind of support do you offer?</h3>
              <p className="text-gray-600">We provide 24/7 support through multiple channels including email, chat, and phone. Enterprise customers get dedicated support managers.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-3">How does the AI automation work?</h3>
              <p className="text-gray-600">Our AI analyzes your infrastructure patterns and automatically suggests optimizations, handles scaling, and prevents potential issues before they occur.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-300 to-orange-400">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Infrastructure?</h2>
          <p className="text-white/90 mb-8 text-lg">Join hundreds of companies already using floxide.io to manage their cloud infrastructure.</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-orange-400 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border-2 border-white text-white px-8 py-3 text-sm font-semibold hover:bg-white/10 transition-colors duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">floxide.io</h3>
              <p className="text-gray-400">The future of infrastructure management</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} floxide.io. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
