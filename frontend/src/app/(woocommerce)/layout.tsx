"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut, 
  ChevronRight,
  Bell,
  Sun,
  Moon,
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useUserStore } from "@/store/userStore"
import { useLogout } from "@/lib/mutation/auth/logout"

// Nav items configuration
const navItems = [
  { name: "Products", href: "/product", icon: Package },
  { name: "Integration", href: "/integration", icon: Users },
]

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  
  // Get user from Zustand store
  const { user, isAuthenticated, logout } = useUserStore()

  // Correctly use the useLogout hook
  const { mutate: logoutUser } = useLogout()
  
  // To avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Handle logout
  const handleLogout = () => {
    // Just call the mutation, which will handle logout state internally
    logoutUser()
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "?";
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          <h1 className="text-xl font-bold text-white">WooCommerce</h1>
        </div>
        
        <div className="p-4">
          {isAuthenticated && user && (
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
            </div>
          )}
          
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-md px-3 py-3 transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-md"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : ""}`} />
                  <span>{item.name}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            className="w-full gap-2 justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`lg:pl-72`}>
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 shadow-sm dark:border-gray-700">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          {/* Breadcrumb */}
          <div className="hidden md:block">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="text-gray-500 dark:text-gray-400">/</li>
                <li>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {pathname.split('/').pop()?.charAt(0).toUpperCase() + pathname.split('/').pop()?.slice(1) || 'Dashboard'}
                  </span>
                </li>
              </ol>
            </nav>
          </div>
          
          
          {/* Right side navbar items */}
          <div className="ml-auto flex items-center gap-4">
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            
            <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
            
            
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-gray-600">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>
        
        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md py-6">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} WooCommerce Admin. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Terms of Service
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}