import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

const BlogDetail = () => {
  const { id } = useParams();

  // Blog post data
  const blogPosts = {
    1: {
      title: "The Rise of Micro-Tasks: How Macroworkers is Redefining Work in the Digital Age",
      category: "Industry Trends",
      readTime: "5 min",
      publishDate: "January 2025",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756456717/Gemini_Generated_Image_g4t0og4t0og4t0og_ipqg9p.png",
      content: `
        <h2>Introduction</h2>
        <p>The way we work is changing. Traditional 9-to-5 jobs are no longer the only way to earn income. Across the globe, millions of people are shifting toward micro-tasking platforms like Macroworkers, where small tasks generate real money. This evolution represents a new wave of digital labor — flexible, borderless, and inclusive.</p>

        <h2>What Are Micro-Tasks?</h2>
        <p>Micro-tasks are small, simple jobs that can be completed in minutes. Examples include:</p>
        <ul>
          <li>Testing apps or websites</li>
          <li>Writing short reviews</li>
          <li>Data entry</li>
          <li>Social media engagement</li>
          <li>Content moderation</li>
        </ul>
        <p>Each task may pay a small amount, but when combined, they can provide significant earnings for workers, especially in regions where traditional job opportunities are limited.</p>

        <h2>Why Macroworkers is Different</h2>
        <p>Unlike older platforms, Macroworkers provides:</p>
        <ul>
          <li><strong>Transparent task flows</strong> (employer creates → worker completes → admin verifies → payment released)</li>
          <li><strong>Global participation</strong> (anyone with internet can join)</li>
          <li><strong>Skill-friendly growth</strong> (workers start small, but can move toward bigger projects)</li>
        </ul>

        <h2>Impact on Workers</h2>
        <p>For students, homemakers, and freelancers, micro-tasks provide:</p>
        <ul>
          <li>Flexible work schedules</li>
          <li>Extra income without leaving home</li>
          <li>Opportunities to learn digital skills</li>
        </ul>

        <h2>Impact on Employers</h2>
        <p>Businesses benefit by:</p>
        <ul>
          <li>Accessing a global workforce instantly</li>
          <li>Getting tasks done quickly</li>
          <li>Reducing costs compared to hiring full-time staff</li>
        </ul>

        <h2>Conclusion</h2>
        <p>Macroworkers isn't just about "small tasks." It's about creating a global marketplace for opportunity. The rise of digital labor platforms shows that the future of work is distributed, flexible, and accessible to all.</p>
      `
    },
    2: {
      title: "How Macroworkers Empowers Employers: Smart Outsourcing for the 21st Century",
      category: "Business",
      readTime: "8 min",
      publishDate: "January 2025",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756460695/Gemini_Generated_Image_z0erhqz0erhqz0er_npey0p.png",
      content: `
        <h2>Introduction</h2>
        <p>Businesses face pressure to scale faster, reduce costs, and remain competitive. Hiring full-time employees for every task is not always practical. That's where Macroworkers steps in, giving employers an on-demand workforce at their fingertips.</p>

        <h2>Why Employers Choose Macroworkers</h2>
        <ul>
          <li><strong>Cost-Effective</strong> – Employers pay only for completed work.</li>
          <li><strong>Scalable</strong> – Whether 10 tasks or 10,000, Macroworkers can handle it.</li>
          <li><strong>Speed</strong> – Workers are distributed worldwide, ensuring fast turnaround.</li>
          <li><strong>Flexibility</strong> – Employers can post everything from app testing to survey responses.</li>
        </ul>

        <h2>Example Tasks Employers Outsource</h2>
        <ul>
          <li>Marketing campaigns (likes, shares, reviews)</li>
          <li>Product feedback surveys</li>
          <li>Data collection and tagging for AI training</li>
          <li>Lead generation for sales</li>
          <li>Software QA testing</li>
        </ul>

        <h2>Case Study: Startup Growth</h2>
        <p>A startup that needs 10,000 data points for AI training can achieve it in 2-3 days using Macroworkers, compared to months with an internal team.</p>

        <h2>Trust & Security</h2>
        <p>Macroworkers ensures:</p>
        <ul>
          <li>Verified worker accounts</li>
          <li>Anti-fraud checks</li>
          <li>Admin oversight for payment fairness</li>
        </ul>

        <h2>Conclusion</h2>
        <p>Macroworkers isn't just outsourcing; it's smart outsourcing. It empowers employers to scale quickly, save money, and access a global workforce.</p>
      `
    },
    3: {
      title: "From Clicks to Cash: How Workers Earn Real Income with Macroworkers",
      category: "Success Stories",
      readTime: "6 min",
      publishDate: "January 2025",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756460946/Gemini_Generated_Image_3jjbgx3jjbgx3jjb_jws2le.png",
      content: `
        <h2>Introduction</h2>
        <p>In today's digital economy, earning money online is a dream for many. But not all opportunities are genuine. Macroworkers, however, has established a trusted platform where clicks turn into real cash.</p>

        <h2>How Workers Get Started</h2>
        <ul>
          <li>Sign up for free</li>
          <li>Browse available tasks</li>
          <li>Complete tasks with proof</li>
          <li>Submit for approval</li>
          <li>Get paid securely</li>
        </ul>

        <h2>Types of Work Available</h2>
        <ul>
          <li>Writing short product reviews</li>
          <li>Watching & rating videos</li>
          <li>Testing mobile apps</li>
          <li>Data entry for research projects</li>
          <li>Joining Telegram/Discord groups for marketing</li>
        </ul>

        <h2>Why Workers Love Macroworkers</h2>
        <ul>
          <li>No special degree required</li>
          <li>Work anytime, anywhere</li>
          <li>Weekly payouts</li>
          <li>Skill-building opportunities (workers who perform better get premium tasks)</li>
        </ul>

        <h2>Real Worker Story</h2>
        <p>A student from India, working 1-2 hours daily, completes 30-40 microtasks and earns enough to cover internet bills + extra pocket money. For many, it's not just side income — it's a step toward financial independence.</p>

        <h2>Conclusion</h2>
        <p>For workers worldwide, Macroworkers is more than a platform. It's a gateway to the global economy, offering freedom, flexibility, and fairness.</p>
      `
    },
    4: {
      title: "The Technology Behind Macroworkers: Secure, Transparent, and Scalable",
      category: "Platform Insights",
      readTime: "5 min",
      publishDate: "January 2025",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756461900/Gemini_Generated_Image_7792z87792z87792_wczwbo.png",
      content: `
        <h2>Introduction</h2>
        <p>Behind every successful digital labor marketplace lies strong technology. Macroworkers isn't just a website; it's a scalable ecosystem powered by modern tools like Supabase, PostgreSQL, authentication, and secure payments.</p>

        <h2>Key Features of the Platform</h2>
        <ul>
          <li><strong>Authentication & Roles</strong> – Workers, Employers, and Admins have different dashboards.</li>
          <li><strong>RLS (Row-Level Security)</strong> – Protects sensitive worker/employer data.</li>
          <li><strong>Real-Time Dashboard</strong> – Admins can track how many tasks are active, completed, and pending payments.</li>
          <li><strong>Secure Payments</strong> – Employers deposit, workers withdraw safely.</li>
        </ul>

        <h2>Why This Matters for Users</h2>
        <ul>
          <li>Employers know their money is safe until tasks are verified.</li>
          <li>Workers trust that their completed work will be paid.</li>
          <li>Admins prevent fraud through automated checks.</li>
        </ul>

        <h2>Scaling for the Future</h2>
        <p>Macroworkers is being built like a 100,000 crore company:</p>
        <ul>
          <li>Cloud-based infrastructure</li>
          <li>AI-driven fraud detection</li>
          <li>Analytics for both employers and workers</li>
        </ul>

        <h2>Conclusion</h2>
        <p>Technology ensures Macroworkers runs smoothly, securely, and fairly. This makes it a future-proof platform ready to handle millions of users.</p>
      `
    },
    5: {
      title: "The Future of Work: Why Platforms Like Macroworkers Will Dominate the Next Decade",
      category: "Future Trends",
      readTime: "6 min",
      publishDate: "January 2025",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756462337/Gemini_Generated_Image_1zvghn1zvghn1zvg_kbdxdd.png",
      content: `
        <h2>Introduction</h2>
        <p>By 2035, over 50% of the global workforce will engage in some form of digital freelancing or micro-tasking. Platforms like Macroworkers are at the center of this revolution.</p>

        <h2>Global Trends Driving This Shift</h2>
        <ul>
          <li><strong>Remote Work Boom</strong> – Post-pandemic, companies trust remote workers.</li>
          <li><strong>AI & Automation</strong> – Machines still need humans for data training & quality checks.</li>
          <li><strong>Rising Gig Economy</strong> – People want flexibility instead of rigid jobs.</li>
        </ul>

        <h2>Opportunities Ahead</h2>
        <h3>For Workers:</h3>
        <ul>
          <li>Access to global jobs without relocation</li>
          <li>Building digital skills while earning</li>
          <li>Creating a personal work portfolio</li>
        </ul>

        <h3>For Employers:</h3>
        <ul>
          <li>Hiring talent from multiple countries</li>
          <li>Saving costs compared to traditional agencies</li>
          <li>Instant workforce access during peak demand</li>
        </ul>

        <h2>Why Macroworkers Stands Out</h2>
        <ul>
          <li>Focus on trust and transparency</li>
          <li>Built for scale and future tech integration</li>
          <li>Community-driven, ensuring workers and employers both grow</li>
        </ul>

        <h2>Conclusion</h2>
        <p>The future belongs to platforms like Macroworkers. It's not just about earning or outsourcing — it's about reshaping the global economy where every small click contributes to something big.</p>
      `
    }
  };

  const post = blogPosts[Number(id) as keyof typeof blogPosts];

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="outline" className="mb-6" asChild>
          <Link to="/blogs">← Back to Blog</Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button variant="outline" className="mb-6" asChild>
          <Link to="/blogs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
        
        <article className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Badge variant="secondary">{post.category}</Badge>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {post.publishDate}
              </div>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
          </div>

          {/* Featured Image */}
          <div className="relative">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </motion.div>
    </div>
  );
};

export default BlogDetail;