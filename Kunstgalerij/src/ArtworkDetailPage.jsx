import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import './ArtworkDetailPage.css';

function ArtworkDetailPage() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [images, setImages] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArtworkDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/artworks/${id}`);
        setArtwork(response.data.artwork);
        setImages(response.data.images);
        setTechniques(response.data.techniques);
        setComments(response.data.comments);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchArtworkDetails();
  }, [id]);

  if (loading) return <div className="loading">Laden...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!artwork) return <div className="not-found">Kunstwerk niet gevonden</div>;

  return (
    <div className="artwork-detail-page">
      <Link to="/" className="back-link">← Terug naar galerij</Link>

      <div className="artwork-header">
        <h1>{artwork.title}</h1>
        <h2>door {artwork.artist_name}</h2>
      </div>

      <div className="artwork-content">
        <div className="artwork-main-image">
          {images.length > 0 ? (
            <img
              src={`/artwork/${artwork.artist_name.toLowerCase().replace(' ', '_')}.jpg`}
              alt={artwork.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder.jpg';
              }}
            />
          ) : (
            <div className="no-image">Geen afbeelding beschikbaar</div>
          )}
        </div>

        <div className="artwork-details">
          <div className="artwork-description">
            <h3>Beschrijving</h3>
            <p>{artwork.description || 'Geen beschrijving beschikbaar'}</p>
          </div>

          <div className="artwork-meta">
            <h3>Details</h3>
            <ul>
              {artwork.year && <li><strong>Jaar:</strong> {artwork.year}</li>}
              {artwork.dimensions && <li><strong>Afmetingen:</strong> {artwork.dimensions}</li>}
              {artwork.price && <li><strong>Prijs:</strong> €{artwork.price.toFixed(2)}</li>}
            </ul>
          </div>

          {techniques.length > 0 && (
            <div className="artwork-techniques">
              <h3>Technieken</h3>
              <ul>
                {techniques.map(technique => (
                  <li key={technique.id}>{technique.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {comments.length > 0 && (
        <div className="artwork-comments">
          <h3>Reacties ({comments.length})</h3>
          {comments.map(comment => (
            <div key={comment.id} className="comment">
              <p><strong>{comment.user_name || comment.author_name || 'Anoniem'}</strong></p>
              <p>{comment.content}</p>
              <small>{new Date(comment.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArtworkDetailPage;