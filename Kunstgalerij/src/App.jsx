import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

//GalleryPage en ArtworkDetail toegevoegd door Rudy als object van de App
import GalleryPage from './GalleryPage';
import ArtworkDetailPage from './ArtworkDetailPage';

/* Onderstaande heeft Rudy al toegeveord in losse bestanden
function GalleryPage() {
  return (
    <div>
      <h1 className="page-title">Kunstwerken</h1>
      <p>Hier komt het overzicht van alle kunstwerken met zoekbalk.</p>
    </div>
  );
}

function ArtworkDetailPage() {
  return (
    <div>
      <h1 className="page-title">Details kunstwerk</h1>
      <p>Hier komen beschrijving, jaar, technieken, favoriet-knop en opmerkingen.</p>
    </div>
  );
}
*/

//Placeholder pages – kun je later in aparte bestanden zetten
function FavoritesPage() {
  return (
    <div>
      <h1 className="page-title">Favorieten</h1>
      <p>Hier komen alle kunstwerken die als favoriet zijn gemarkeerd.</p>
    </div>
  );
}

function AdminPage() {
  return (
    <div>
      <h1 className="page-title">Admin-paneel</h1>
      <p>Hier kun je kunstwerken toevoegen, bewerken en verwijderen.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* 🔝 Topbar / navigatie */}
        <header className="app-header">
          <h2 className="logo">🎨 Kunstgalerij</h2>
          <nav className="nav">
            <Link to="/">Kunstwerken</Link>
            <Link to="/favorites">Favorieten</Link>
            <Link to="/profile">User x</Link>


            <Link to="/admin">Admin</Link>
          </nav>
        </header>

        {/* 📦 Hoofdcontent */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        {/* 👣 Footer (optioneel) */}
        <footer className="app-footer">
          <small>&copy; {new Date().getFullYear()} Mijn Kunstapp</small>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
