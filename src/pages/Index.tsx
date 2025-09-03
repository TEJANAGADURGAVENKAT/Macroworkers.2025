import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  IndianRupee, 
  Star, 
  Globe, 
  Zap,
  CheckCircle,
  TrendingUp,
  Shield
} from "lucide-react";
import { formatINR } from "@/lib/utils";

const Index = () => {
  const stats = [
    { label: "Active Employees/Workers", value: "2M+", icon: Users },
    { label: "Tasks Completed", value: "50M+", icon: CheckCircle },
    { label: "Money Earned", value: "₹100M+", icon: IndianRupee },
    { label: "Countries", value: "150+", icon: Globe },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Digital Marketer",
      avatar: "SC",
      content: `I've earned over ${formatINR(2000)} in my first month. The tasks are simple and payments are always on time!`,
      rating: 5,
      earnings: formatINR(2847)
    },
    {
      name: "Miguel Rodriguez",
      role: "Content Creator", 
      avatar: "MR",
      content: "Macroworkers helped me find quality employees/workers for my social media campaigns. Amazing results!",
      rating: 5,
      savings: "60% faster"
    },
    {
      name: "Emma Thompson",
      role: "Student",
      avatar: "ET", 
      content: "Perfect for earning pocket money between classes. User-friendly and reliable platform.",
      rating: 5,
      earnings: formatINR(1245)
    }
  ];

  const blogPreviews = [
    {
      id: 1,
      title: "The Rise of Micro-Tasks: How Macroworkers is Redefining Work in the Digital Age",
      excerpt: "The way we work is changing. Traditional 9-to-5 jobs are no longer the only way to earn income. Across the globe, millions of people are shifting toward micro-tasking platforms like Macroworkers.",
      readTime: "7 min read",
      category: "Industry Trends"
    },
    {
      id: 2,
      title: "How Macroworkers Empowers Employers: Smart Outsourcing for the 21st Century",
      excerpt: "Businesses face pressure to scale faster, reduce costs, and remain competitive. Hiring full-time employees for every task is not always practical. That's where Macroworkers steps in.",
      readTime: "6 min read", 
      category: "Business"
    },
    {
      id: 3,
      title: "From Clicks to Cash: How Workers Earn Real Income with Macroworkers",
      excerpt: "In today's digital economy, earning money online is a dream for many. But not all opportunities are genuine. Macroworkers, however, has established a trusted platform where clicks turn into real cash.",
      readTime: "6 min read",
      category: "Success Stories"
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Badge className="bg-gradient-primary text-primary-foreground">
                <Zap className="w-4 h-4 mr-2" />
                New: Instant payments now available
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
                  Work Online.
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    {" "}Earn Money.
                  </span>
                  <br />Post Tasks.
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg">
                  Connect with skilled employees/workers worldwide or earn money by completing simple tasks. 
                  Join over 2 million users making money online.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="bg-gradient-primary hover:bg-primary-dark text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                  <Link to="/register">
                    Become an Employee/Worker
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                  <Link to="/register">
                    Post a Task
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mr-1" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-1" />
                  <span>Secure payments</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative bg-gradient-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {stats.slice(0, 2).map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      className="bg-background rounded-xl p-3 sm:p-4 text-center"
                    >
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-primary" />
                      <div className="text-lg sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {stats.slice(2).map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                      className="bg-background rounded-xl p-4 text-center"
                    >
                      <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4">Trusted by millions</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied employees/workers and employers who trust Macroworkers
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-gradient-card border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">{testimonial.content}</p>
                    {testimonial.earnings && (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Earned {testimonial.earnings}
                      </Badge>
                    )}
                    {testimonial.savings && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Zap className="w-3 h-3 mr-1" />
                        {testimonial.savings}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge className="mb-4">Learn & Grow</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Latest from Our Blog</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tips, insights, and success stories to help you succeed
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
            {blogPreviews.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group" asChild>
                  <Link to={`/blogs/${post.id}`}>
                    <CardContent className="p-4 sm:p-6">
                      <Badge className="mb-3 sm:mb-4">{post.category}</Badge>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">{post.excerpt}</p>
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <span>{post.readTime}</span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button variant="outline" size="lg" asChild>
              <Link to="/blogs">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90">
              Join millions of employees/workers and employers who trust Macroworkers for their projects and income.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6">
                <Link to="/register">
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link to="/signin">
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;