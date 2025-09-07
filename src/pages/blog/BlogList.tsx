import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const BlogList = () => {
  const posts = [
    { 
      id: 1, 
      title: "The Rise of Micro-Tasks: How Macroworkers is Redefining Work in the Digital Age", 
      category: "Industry Trends", 
      readTime: "5 min",
      excerpt: "The way we work is changing. Traditional 9-to-5 jobs are no longer the only way to earn income. Across the globe, millions of people are shifting toward micro-tasking platforms like Macroworkers, where small tasks generate real money.",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756456717/Gemini_Generated_Image_g4t0og4t0og4t0og_ipqg9p.png",
      featured: true
    },
    { 
      id: 2, 
      title: "How Macroworkers Empowers Employers: Smart Outsourcing for the 21st Century", 
      category: "Business", 
      readTime: "8 min",
      excerpt: "Businesses face pressure to scale faster, reduce costs, and remain competitive. That's where Macroworkers steps in, giving employers an on-demand workforce at their fingertips.",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756460695/Gemini_Generated_Image_z0erhqz0erhqz0er_npey0p.png"
    },
    { 
      id: 3, 
      title: "From Clicks to Cash: How Workers Earn Real Income with Macroworkers", 
      category: "Success Stories", 
      readTime: "6 min",
      excerpt: "In today's digital economy, earning money online is a dream for many. But not all opportunities are genuine. Macroworkers, however, has established a trusted platform where clicks turn into real cash.",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756460946/Gemini_Generated_Image_3jjbgx3jjbgx3jjb_jws2le.png"
    },
    { 
      id: 4, 
      title: "The Technology Behind Macroworkers: Secure, Transparent, and Scalable", 
      category: "Platform Insights", 
      readTime: "5 min",
      excerpt: "Behind every successful digital labor marketplace lies strong technology. Macroworkers isn't just a website; it's a scalable ecosystem powered by modern tools like Supabase, PostgreSQL, authentication, and secure payments.",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756461900/Gemini_Generated_Image_7792z87792z87792_wczwbo.png"
    },
    { 
      id: 5, 
      title: "The Future of Work: Why Platforms Like Macroworkers Will Dominate the Next Decade", 
      category: "Future Trends", 
      readTime: "6 min",
      excerpt: "By 2035, over 50% of the global workforce will engage in some form of digital freelancing or micro-tasking. Platforms like Macroworkers are at the center of this revolution.",
      image: "https://res.cloudinary.com/ddw4avyim/image/upload/v1756462337/Gemini_Generated_Image_1zvghn1zvghn1zvg_kbdxdd.png"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">Macroworkers Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights, tips, and stories from the world of micro-tasking and digital work
        </p>
      </motion.div>

      <div className="space-y-16">
        {/* Blog Post 1 - Image Left, Content Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="lg:w-1/2">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={posts[0].image} 
                alt={posts[0].title}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div className="h-px bg-primary flex-1"></div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">{posts[0].category}</Badge>
              <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
                {posts[0].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {posts[0].excerpt}
              </p>
              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link to={`/blogs/${posts[0].id}`}>Read Full Article</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blog Post 2 - Content Left, Image Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="lg:w-1/2 space-y-6 order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <div className="h-px bg-primary flex-1"></div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">{posts[1].category}</Badge>
              <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
                {posts[1].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {posts[1].excerpt}
              </p>
              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link to={`/blogs/${posts[1].id}`}>Read Full Article</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={posts[1].image} 
                alt={posts[1].title}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Blog Post 3 - Image Left, Content Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="lg:w-1/2">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={posts[2].image} 
                alt={posts[2].title}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <div className="h-px bg-primary flex-1"></div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">{posts[2].category}</Badge>
              <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
                {posts[2].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {posts[2].excerpt}
              </p>
              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link to={`/blogs/${posts[2].id}`}>Read Full Article</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blog Post 4 - Content Left, Image Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="lg:w-1/2 space-y-6 order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
              <div className="h-px bg-primary flex-1"></div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">{posts[3].category}</Badge>
              <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
                {posts[3].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {posts[3].excerpt}
              </p>
              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link to={`/blogs/${posts[3].id}`}>Read Full Article</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 order-1 lg:order-2">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={posts[3].image} 
                alt={posts[3].title}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* Blog Post 5 - Image Left, Content Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col lg:flex-row gap-8 items-center"
        >
          <div className="lg:w-1/2">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
              <img 
                src={posts[4].image} 
                alt={posts[4].title}
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">5</div>
              <div className="h-px bg-primary flex-1"></div>
            </div>
            <div>
              <Badge variant="secondary" className="mb-3">{posts[4].category}</Badge>
              <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
                {posts[4].title}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                {posts[4].excerpt}
              </p>
              <div className="flex items-center justify-end">
                <Button asChild>
                  <Link to={`/blogs/${posts[4].id}`}>Read Full Article</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogList;