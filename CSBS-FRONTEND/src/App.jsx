import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer/ToastContainer';
import './index.css';

const Home = lazy(() => import('./pages/Home'));
const AiChat = lazy(() => import('./pages/AiChat'));
const Booking = lazy(() => import('./pages/Booking'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
      Загрузка...
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ToastContainer />
        <Navigation />
        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/ai-assistant" element={<AiChat />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
