import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/", label: "Accueil", icon: "fas fa-home" },
      { href: "/customer", label: "Marketplace", icon: "fas fa-shopping-bag" },
    ];

    if (user?.role === 'vendor') {
      baseLinks.push({ href: "/vendor", label: "Vendeur", icon: "fas fa-store" });
    }
    
    if (user?.role === 'driver') {
      baseLinks.push({ href: "/driver", label: "Livreur", icon: "fas fa-motorcycle" });
    }
    
    if (user?.role === 'admin') {
      baseLinks.push({ href: "/admin", label: "Admin", icon: "fas fa-cog" });
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-zaka-orange">ZakaMall</h1>
                <p className="text-xs text-zaka-gray">Marketplace du Burkina</p>
              </div>
            </div>
            <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex-shrink-0 cursor-pointer">
                <h1 className="text-2xl font-bold text-zaka-orange">ZakaMall</h1>
                <p className="text-xs text-zaka-gray">Marketplace du Burkina</p>
              </div>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <i className="fas fa-bars text-xl text-zaka-gray"></i>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center mb-8">
                    <h2 className="text-xl font-bold text-zaka-orange">Menu</h2>
                  </div>
                  
                  {user && (
                    <div className="flex items-center mb-6 p-4 bg-zaka-light rounded-lg">
                      <Avatar className="w-12 h-12 mr-3">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-zaka-orange text-white">
                          {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-zaka-dark">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-zaka-gray capitalize">{user.role}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <Button
                          variant={location === link.href ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <i className={`${link.icon} mr-3`}></i>
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Se déconnecter
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={location === link.href ? "secondary" : "ghost"}
                  className="text-zaka-dark hover:text-zaka-orange transition-colors"
                >
                  <i className={`${link.icon} mr-2`}></i>
                  {link.label}
                </Button>
              </Link>
            ))}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-zaka-orange text-white">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {user.role}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <i className="fas fa-user mr-2 w-4 h-4"></i>
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <i className="fas fa-cog mr-2 w-4 h-4"></i>
                    <span>Paramètres</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <i className="fas fa-sign-out-alt mr-2 w-4 h-4"></i>
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
