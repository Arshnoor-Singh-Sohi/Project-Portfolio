import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BasicTest from './pages/BasicTest';
import HomePage from './pages/HomePage';
import SimplePortfolio from './pages/SimplePortfolio';
import AwwardsPortfolio from './pages/AwwardsPortfolio';
import ComicPortfolio from './pages/ComicPortfolio';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import SubscribeStatus from './pages/SubscribeStatus';
import NotFound from './pages/NotFound';
import QuickNav from './components/QuickNav';

// /notes is unlisted and loaded on demand, so its code and note text
// stay out of the main bundle.
const NotesPage = lazy(() => import('./pages/NotesPage'));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* <Route path="/" element={<BasicTest />} /> */}
          {/* <Route path="/" element={<HomePage />} /> */}
          {/* <Route path="/" element={<SimplePortfolio />} /> */}
          {/* <Route path="/" element={<AwwardsPortfolio />} /> */}
          <Route path="/" element={<ComicPortfolio />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route
            path="/notes/*"
            element={
              <Suspense fallback={null}>
                <NotesPage />
              </Suspense>
            }
          />
          <Route path="/subscribe/:status" element={<SubscribeStatus />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <QuickNav />
      </BrowserRouter>
    </div>
  );
}

export default App;
