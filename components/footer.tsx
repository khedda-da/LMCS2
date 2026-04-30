import Link from 'next/link'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* LMCS Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">LMCS Laboratory</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Advanced research and supervision management platform for academic excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Research</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">News</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Events</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Sitemap</Link></li>
            </ul>
          </div>
        </div>

        {/* ESI School Information */}
        <div className="border-t border-border pt-12 mt-12">
          <h3 className="text-2xl font-bold text-foreground mb-8">ESI (Ecole Nationale Supérieure d'Informatique)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Location */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Location</h4>
                <p className="text-sm text-muted-foreground">
                  BP 16270<br />
                  Oued Smar<br />
                  Algérie
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:+21323939132" className="hover:text-primary transition-colors">
                    +213 23 93 91 32
                  </a>
                </p>
              </div>
            </div>

            {/* Fax */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Fax</h4>
                <p className="text-sm text-muted-foreground">
                  +213 23 93 91 34
                </p>
              </div>
            </div>

            {/* Website */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Website</h4>
                <p className="text-sm text-muted-foreground">
                  <a href="https://www.esi.dz" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    www.esi.dz
                  </a>
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground bg-card p-4 rounded-lg border border-border">
            ESI is a prestigious national computer science school in Algeria, dedicated to advancing research and academic excellence in information technology and related fields.
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 LMCS Laboratory. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://www.esi.dz" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ESI Official Website
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
