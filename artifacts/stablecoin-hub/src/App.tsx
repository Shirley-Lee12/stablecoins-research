import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import About from "@/pages/about";
import Research from "@/pages/research";
import AcademicResources from "@/pages/academic-resources";
import Experts from "@/pages/experts";
import AuthorPage from "@/pages/author";
import Regulatory from "@/pages/regulatory";
import MarketData from "@/pages/market-data";
import Quantitative from "@/pages/quantitative";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/about-stablecoins" component={About} />
        <Route path="/research" component={Research} />
        <Route path="/academic-resources" component={AcademicResources} />
        <Route path="/experts" component={Experts} />
        <Route path="/authors/:name" component={AuthorPage} />
        <Route path="/regulatory" component={Regulatory} />
        <Route path="/market-data" component={MarketData} />
        <Route path="/quantitative" component={Quantitative} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
