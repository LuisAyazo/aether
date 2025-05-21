import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center py-20 px-4 text-center hero-gradient">
        <div className="fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Aether</h1>
          <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">The AI-Powered Infrastructure Fabric</h2>
          <p className="max-w-2xl text-lg mb-10">
            Simplifying cloud infrastructure management with AI and visual interfaces.
            Open-source IaC that makes complex deployments accessible to everyone.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row justify-center">
            <Link
              href="/dashboard"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get started
            </Link>
            <Link
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-6"
              href="#features"
            >
              See Features
            </Link>
            <Link
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-base h-12 px-6"
              href="/examples"
            >
              View Examples
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-3">Visual DSL</h3>
              <p className="mb-4">Create infrastructure with intuitive drag-and-drop interface, no code required.</p>
              <ul className="text-sm space-y-2">
                <li>• Intuitive cloud architecture diagrams</li>
                <li>• Visual dependency management</li>
                <li>• No coding knowledge required</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-3">AI Assistant</h3>
              <p className="mb-4">Optimize costs, enhance security, and generate infrastructure code from natural language.</p>
              <ul className="text-sm space-y-2">
                <li>• Cost optimization suggestions</li>
                <li>• Security vulnerability detection</li>
                <li>• Natural language to IaC conversion</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-3">Real-time Observability</h3>
              <p className="mb-4">Monitor infrastructure state and get AI-powered root cause analysis for failures.</p>
              <ul className="text-sm space-y-2">
                <li>• Live infrastructure dashboard</li>
                <li>• AI-powered root cause analysis</li>
                <li>• Automatic error correction</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="feature-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-3">Governance & CI/CD</h3>
              <p className="mb-4">Enforce security standards and seamlessly integrate with GitOps workflows.</p>
              <ul className="text-sm space-y-2">
                <li>• Policy-as-code enforcement</li>
                <li>• Git integration with PR validation</li>
                <li>• CI/CD pipeline integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Aether Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-4">
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Design</h3>
              <p>Create your infrastructure visually using drag-and-drop or describe it in natural language for AI-assisted generation.</p>
            </div>
            <div className="text-center p-4">
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Validate</h3>
              <p>AI checks for security issues, cost optimization opportunities, and compliance with governance policies.</p>
            </div>
            <div className="text-center p-4">
              <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-bold text-xl mb-3">Deploy</h3>
              <p>Seamlessly provision resources across cloud providers with confidence and real-time monitoring.</p>
            </div>
          </div>
          <div className="text-center">
            <a href="#" className="btn-primary inline-block py-3 px-8 rounded-lg">
              See Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Why Aether?</h2>
          <p className="text-lg mb-10">
            Aether revolutionizes infrastructure management by making IaC more accessible, 
            intelligent, and secure than traditional tools like Terraform and Pulumi. 
            Our AI-powered platform eliminates complexity while maintaining enterprise-grade reliability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-2">Accessibility</h3>
              <p>Visual interfaces and AI assistance make cloud infrastructure management accessible to everyone, regardless of technical expertise.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-2">Intelligence</h3>
              <p>Built-in AI provides optimization suggestions, error prevention, and automated compliance to enhance your infrastructure decisions.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-xl mb-2">Security</h3>
              <p>Proactive security checks and governance policies ensure your infrastructure follows best practices and remains compliant.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How We Compare</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-800">
                  <th className="pb-3"></th>
                  <th className="pb-3 text-center font-bold text-primary">Aether</th>
                  <th className="pb-3 text-center">Terraform</th>
                  <th className="pb-3 text-center">Pulumi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 font-medium">Visual Interface</td>
                  <td className="text-center py-3">✅</td>
                  <td className="text-center py-3">❌</td>
                  <td className="text-center py-3">❌</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 font-medium">AI Assistant</td>
                  <td className="text-center py-3">✅</td>
                  <td className="text-center py-3">❌</td>
                  <td className="text-center py-3">❌</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 font-medium">Auto-remediation</td>
                  <td className="text-center py-3">✅</td>
                  <td className="text-center py-3">❌</td>
                  <td className="text-center py-3">❌</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <td className="py-3 font-medium">Natural Language to IaC</td>
                  <td className="text-center py-3">✅</td>
                  <td className="text-center py-3">❌</td>
                  <td className="text-center py-3">❌</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Learning Curve</td>
                  <td className="text-center py-3">Low</td>
                  <td className="text-center py-3">High</td>
                  <td className="text-center py-3">High</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/10 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Infrastructure?</h2>
          <p className="text-lg mb-8">
            Join the growing community of developers and enterprises using Aether to simplify their cloud operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              className="btn-primary rounded-lg py-3 px-8 font-medium"
              href="#"
            >
              Get Early Access
            </a>
            <a
              className="rounded-lg border border-solid border-primary text-primary py-3 px-8 font-medium hover:bg-primary/5"
              href="#"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">Aether</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                The AI-Powered Infrastructure Fabric that simplifies cloud management for everyone.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary">Features</a></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">Demo</a></li>
                <li><a href="#" className="hover:text-primary">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary">Documentation</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Community</a></li>
                <li><a href="#" className="hover:text-primary">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary">About</a></li>
                <li><a href="#" className="hover:text-primary">Team</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">© 2023 Aether. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Terms
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Privacy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
