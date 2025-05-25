import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sectionId, setSectionId] = useState(1); // výchozí hodnota
  const [author, setAuthor] = useState(""); // přidáno pro autora
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
        setAuthor(data.author || ""); // pokud autor není v datech, nastavíme prázdný řetězec
        setSectionId(data.section_id); // <-- zde načteš aktuální sekci
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      section_id: sectionId, // použiješ aktuální sekci
      title,
      content,
      author,// Později bude autentizace - autor je prozatím Volitelný
      created_at: new Date()
    };
    const response = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      alert(error.message || "Chyba při ukládání!");
      return;
    }
    navigate(`/posts/${id}`); // vrátí zpět na předchozí stránku
    //window.location.reload(); // obnoví stránku, aby se změny projevily
    console.log("Článek úspěšně aktualizován:", body);
  };

  if (loading) return <div>Načítám...</div>;

  return (
    <div>
      <h2>Editace článku</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Název článku</label>
          <input
            type="text"
            className="form-control"
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="content" className="form-label">Obsah článku</label>
          <textarea
            className="form-control"
            id="content"
            rows="5"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="author" className="form-label">Autor:</label>
          <input
            type="text"
            className="form-control"
            id="author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Uložit změny</button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)}>Zrušit</button>
      </form>
    </div>
  );
};

// PostEdit.jsx
// Tento komponent slouží k editaci existujícího článku

export default PostEdit;