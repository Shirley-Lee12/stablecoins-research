import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import HomeOverview from "@/pages/home-overview";
import Dashboard from "@/pages/dashboard";
import About from "@/pages/about";
import AboutHistoryPage from "@/pages/about-history";
import AboutTypesPage from "@/pages/about-types";
import AboutApplicationsPage from "@/pages/about-applications";
import StablecoinMechanismPage from "@/pages/stablecoin-mechanism";
import AboutRegulatoryEvolutionPage from "@/pages/about-regulatory-evolution";
import Research from "@/pages/research";
import AcademicResources from "@/pages/academic-resources";
import Experts from "@/pages/experts";
import AuthorPage from "@/pages/author";
import Regulatory from "@/pages/regulatory";
import MarketData from "@/pages/market-data";
import Quantitative from "@/pages/quantitative";
import ResetPassword from "@/pages/reset-password";
import AdminCenter from "@/pages/admin-center";
import MyContributionsPage from "@/pages/my-contributions";
import ProfilePage from "@/pages/profile";
import ChangePasswordPage from "@/pages/change-password";
import VerifyEmailPage from "@/pages/verify-email";
import {
  QuantDimensionA,
  QuantDimensionB,
  MarketPriceTracking,
  MarketTradingVolume,
} from "@/pages/placeholder";

const queryClient = new QueryClient();

function ExpertsPage() {
  return <Experts />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        {/* Core pages */}
        <Route path="/" component={HomeOverview} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/about-stablecoins" component={About} />
        <Route path="/research" component={Research} />
        <Route path="/academic-resources" component={AcademicResources} />
        <Route path="/experts" component={ExpertsPage} />
        <Route path="/authors/:name" component={AuthorPage} />
        <Route path="/regulatory" component={Regulatory} />
        <Route path="/market-data" component={MarketData} />
        <Route path="/quantitative" component={Quantitative} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/admin" component={AdminCenter} />

        {/* About Stablecoins sub-pages */}
        <Route path="/about-stablecoins/history" component={AboutHistoryPage} />
        <Route path="/about-stablecoins/types/:mechanism" component={StablecoinMechanismPage} />
        <Route path="/about-stablecoins/types" component={AboutTypesPage} />
        <Route path="/about-stablecoins/applications" component={AboutApplicationsPage} />
        <Route path="/about-stablecoins/regulatory-evolution" component={AboutRegulatoryEvolutionPage} />

        {/* Quantitative sub-pages */}
        <Route path="/quantitative/dimension-a" component={QuantDimensionA} />
        <Route path="/quantitative/dimension-b" component={QuantDimensionB} />

        {/* Market Data sub-pages */}
        <Route path="/market-data/price-tracking" component={MarketPriceTracking} />
        <Route path="/market-data/trading-volume" component={MarketTradingVolume} />

        {/* User account pages */}
        <Route path="/profile" component={ProfilePage} />
        <Route path="/change-password" component={ChangePasswordPage} />
        <Route path="/my-contributions" component={MyContributionsPage} />

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
