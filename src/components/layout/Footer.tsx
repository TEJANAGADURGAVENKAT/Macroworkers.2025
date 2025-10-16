import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Twitter, Facebook, Linkedin, Instagram, Github } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Explore: [
      { name: "Home", href: "/" },
      { name: "Tasks", href: "/worker/jobs" },
      { name: "Employers", href: "/employers" },
      { name: "Employees/Workers", href: "/workers" },
    ],
    Resources: [
      { name: "Blogs", href: "/blogs" },
      { name: "Payments", href: "/payments" },
      { name: "Sign In", href: "/signin" },
      { name: "Admin", href: "/admin" },
    ],
    Legal: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "FAQ", href: "/faq" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com/", name: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/", name: "LinkedIn" },
    { icon: Github, href: "https://github.com/", name: "GitHub" },
    { icon: Instagram, href: "https://instagram.com/", name: "Instagram" },
  ];

  return (
    <footer className="relative mt-16 border-t border-border bg-background/60 backdrop-blur">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="container mx-auto px-4 py-10"
      >
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Macroworkers
              </span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A modern micro-employees/workers-style marketplace: post tasks, complete micro-jobs, and
              grow earnings with transparent fees and clean UX.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, name }) => (
                <motion.a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -2 }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label={name}
                  title={name}
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-foreground">{category}</h4>
                  <ul className="mt-3 space-y-2 text-sm">
                    {links.map((link) => (
                      <li key={link.name}>
                        <Link 
                          to={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row"
        >
          <p>© {currentYear} Macroworkers. Built for speed & clarity.</p>
          <p>Designed with React, Tailwind CSS, and Framer Motion.</p>
        </motion.div>
      </motion.div>

      {/* gradient accent */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-1 h-[2px] bg-gradient-to-r from-primary via-accent to-secondary" />
    </footer>
  );
};

export default Footer;