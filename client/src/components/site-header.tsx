import { SiteLogo } from "@/components/site-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b">
      <div className="mx-auto max-w-screen-2xl w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-16">
          <div className="min-w-0">
            <SiteLogo />
          </div>
          <nav className="ml-auto flex items-center gap-2 min-w-0 flex-wrap">
            {/* Navigation items will be added here */}
          </nav>
        </div>
      </div>
    </header>
  );
}
