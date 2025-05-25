import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PostAdd = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [sections, setSections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/sections")
      .then(res => res.json())
      .then(data => setSections(data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section_id: Number(sectionId),
        title,
        content,
        author,
        created_at: new Date().toISOString(), // přidáno pro datum vytvoření
      }),
    });
    if (response.ok) {
      navigate("/");
    } else {
      alert("Chyba při přidávání článku.");
    }
  };

  return (
    <div>
      <h2>Přidat nový článek</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Sekce</label>
          <select
            className="form-select"
            value={sectionId}
            onChange={e => setSectionId(e.target.value)}
            required
          >
            <option value="">Vyber sekci</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>{section.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Název článku</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Obsah článku</label>
          <textarea
            className="form-control"
            rows="5"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Autor</label>
          <input
            type="text"
            className="form-control"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Přidat článek</button>
      </form>
    </div>
  );
};

export default PostAdd;