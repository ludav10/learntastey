import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WineProvider } from './context/WineContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Journal from './pages/Journal';
// GlobeView removed — explore feature cut for launch
import Learn from './pages/Learn';
import { QuickLog, OpenTasting, BlindTasting } from './pages/TastingFlow';
import TastingParty from './pages/TastingParty';
import Level from './pages/Level';
import { SvgWineGlass, SvgGrapes, SvgBarrel, SvgBottle, SvgLeaf, SvgCorkscrew } from './components/WineDecorations';
import './App.css';

export default function App() {
  return (
    <WineProvider>
      <BrowserRouter>
        <div className="app">
          <div className="app-bg-deco" aria-hidden="true">
            <div className="deco-splat s1" />
            <div className="deco-splat s2" />
            <div className="deco-splat s3" />
            <SvgWineGlass  className="deco-svg f1" />
            <SvgGrapes     className="deco-svg f2" />
            <SvgBarrel     className="deco-svg f3" />
            <SvgBottle     className="deco-svg f4" />
            <SvgLeaf       className="deco-svg f5" />
            <SvgCorkscrew  className="deco-svg f6" />
          </div>
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/tasting/quick" element={<QuickLog />} />
              <Route path="/tasting/open" element={<OpenTasting />} />
              <Route path="/tasting/blind" element={<BlindTasting />} />
              <Route path="/party" element={<TastingParty />} />
              <Route path="/level" element={<Level />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WineProvider>
  );
}
