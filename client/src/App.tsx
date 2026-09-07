import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  AccountPage,
  AdminAccountPage,
  AdminPage,
  CartPage,
  CatalogPage,
  CheckoutPage,
  HomePage,
  OrderPage,
  ProductPage,
  RequestCenterPage,
  RequestDetailPage,
  RequestFormPage,
  SearchPage,
} from "./pages/StorePages";

function Router() {
  return <Switch>
    <Route path="/" component={HomePage} />
    <Route path="/games"><CatalogPage category="GAME" /></Route>
    <Route path="/movies"><CatalogPage category="MOVIE" /></Route>
    <Route path="/series"><CatalogPage category="TV_SHOW" /></Route>
    <Route path="/hardware"><CatalogPage category="HARDWARE" /></Route>
    <Route path="/search" component={SearchPage} />
    <Route path="/products/:slug" component={ProductPage} />
    <Route path="/cart" component={CartPage} />
    <Route path="/checkout" component={CheckoutPage} />
    <Route path="/account/requests/:id" component={RequestDetailPage} />
    <Route path="/account" component={AccountPage} />
    <Route path="/account/:section" component={AccountPage} />
    <Route path="/order/:id" component={OrderPage} />
    <Route path="/request/game"><RequestFormPage type="GAME" /></Route>
    <Route path="/request/movie"><RequestFormPage type="MOVIE" /></Route>
    <Route path="/request/series"><RequestFormPage type="SERIES" /></Route>
    <Route path="/request" component={RequestCenterPage} />
    <Route path="/admin/account" component={AdminAccountPage} />
    <Route path="/admin" component={AdminPage} />
    <Route path="/admin/:section" component={AdminPage} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster theme="dark" />
        <Router />
      </TooltipProvider>
    </ThemeProvider>
  </ErrorBoundary>;
}
