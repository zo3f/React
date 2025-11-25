import { useState, useEffect } from 'react';
import axios from 'axios';
//Axios Converteert automatisch JSON-gegevens in de respons naar een JavaScript-object.
//Axios wordt gebruikt om gemakkelijk HTTP-verzoeken (zoals GET, POST, PUT, DELETE) naar servers te sturen/halen
//Zie https://www.digitalocean.com/community/tutorials/js-axios-vanilla-js
import { Link } from 'react-router-dom';
import './GalleryPage.css';

function GalleryPage() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/artworks');
        setArtworks(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artwork.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Laden...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="gallery-page">
      <h1 className="page-title">Kunstwerken</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Zoek kunstwerken..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="artwork-grid">
        {filteredArtworks.map(artwork => (
          <div key={artwork.id} className="artwork-card">
            <Link to={`/artworks/${artwork.id}`}>
              <div className="artwork-image">
                <img
                  src={`/artwork/${artwork.artist_name.toLowerCase().replace(' ', '_')}.jpg`}
                  alt={artwork.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder.jpg';
                  }}
                />
              </div>
              <div className="artwork-info">
                <h3>{artwork.title}</h3>
                <p>{artwork.artist_name}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GalleryPage;