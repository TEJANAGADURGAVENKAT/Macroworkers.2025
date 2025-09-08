import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Menu, 
  X, 
  Home, 
  Briefcase, 
  Users, 
  FileText, 
  CreditCard,
  User,
  LogOut,
  Settings,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  // Function to format role display
  const formatRoleDisplay = (role: string) => {
    switch (role) {
      case 'worker':
        return 'Employees/Workers';
      case 'employer':
        return 'Employer';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  const getNavItems = () => {
    if (!user || !profile) {
      return [
        { name: "Home", href: "/", icon: Home },
        { name: "Tasks", href: "/worker/jobs", icon: Briefcase },
        { name: "Employers", href: "/employers", icon: Users },
        { name: "Employees/Workers", href: "/workers", icon: Users },
        { name: "Blog", href: "/blogs", icon: FileText },
        { name: "Payments", href: "/payments", icon: CreditCard },
      ];
    }

    // Role-based navigation
    const baseItems = [
      { name: "Home", href: "/", icon: Home },
    ];

    switch (profile.role) {
      case 'admin':
        return [
          ...baseItems,
          { name: "Dashboard", href: "/admin", icon: Settings },
          { name: "Users", href: "/admin/users", icon: Users },
          { name: "Tasks", href: "/admin/campaigns", icon: Briefcase },
          { name: "Disputes", href: "/admin/disputes", icon: FileText },
          { name: "Blog", href: "/blogs", icon: FileText },
          { name: "Profile", href: "/admin/profile", icon: User },
        ];
      case 'employer':
        return [
          ...baseItems,
          { name: "Dashboard", href: "/employer", icon: Settings },
          { name: "My Tasks", href: "/employer/campaigns", icon: Briefcase },
          { name: "Create Task", href: "/employer/create-task", icon: FileText },
          { name: "Role-Based Tasks", href: "/employer/role-based-tasks", icon: Plus },
          { name: "Blog", href: "/blogs", icon: FileText },
          { name: "Payments", href: "/employer/payments", icon: CreditCard },
          { name: "Profile", href: "/employer/profile", icon: User },
        ];
      case 'worker':
        return [
          ...baseItems,
          { name: "Dashboard", href: "/worker", icon: Settings },
          { name: "Browse Jobs", href: "/worker/jobs", icon: Briefcase },
          { name: "My Tasks", href: "/worker/tasks", icon: FileText },
          { name: "Blog", href: "/blogs", icon: FileText },
          { name: "Earnings", href: "/worker/earnings", icon: CreditCard },
          { name: "Profile", href: "/worker/profile", icon: User },
        ];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="p-2 bg-gradient-primary rounded-lg"
          >
            <Zap className="h-6 w-6 text-primary-foreground" />
          </motion.div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Macroworkers
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              asChild
              className="text-muted-foreground hover:text-foreground hover:bg-muted/80"
            >
              <Link to={item.href} className="flex items-center space-x-2">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </Button>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user && profile ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{profile.full_name || 'User'}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {formatRoleDisplay(profile.role)}
                </span>
              </div>
              <div className="sm:hidden flex items-center space-x-1">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {formatRoleDisplay(profile.role)}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={signOut}
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button className="bg-gradient-primary hover:bg-primary-dark" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden border-t bg-card/95 backdrop-blur"
        >
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                asChild
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link to={item.href} className="flex items-center space-x-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            ))}
            
            <div className="px-4 py-6 border-t border-border/10">
              <div className="space-y-3">
                {user && profile ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{profile.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{formatRoleDisplay(profile.role)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-muted-foreground"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      asChild
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link to="/signin">Sign In</Link>
                    </Button>
                    <Button 
                      className="w-full bg-gradient-primary hover:bg-primary-dark" 
                      asChild
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Link to="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navigation;