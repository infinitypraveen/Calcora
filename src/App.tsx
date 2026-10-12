import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { CategoryPage } from "./pages/CategoryPage";
import { CalculatorPage } from "./pages/CalculatorPage";
import { HomePage } from "./pages/HomePage";
import { SupportPage } from "./pages/SupportPage";
import {
  AboutPage,
  AffiliatePage,
  ArticlePage,
  ContactPage,
  CorrectionsPage,
  DirectoryPage,
  DisclaimerPage,
  FavoritesPage,
  GuidesPage,
  NotFoundPage,
  PrivacyPage,
  SearchPage,
  SitemapPage,
  TermsPage,
} from "./pages/MiscPages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="calculators/:slug" element={<CalculatorPage />} />
          <Route path="directory" element={<DirectoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="guides" element={<GuidesPage />} />
          <Route path="guides/:slug" element={<ArticlePage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="sitemap" element={<SitemapPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="disclaimer" element={<DisclaimerPage />} />
          <Route path="affiliate-disclosure" element={<AffiliatePage />} />
          <Route path="corrections" element={<CorrectionsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
