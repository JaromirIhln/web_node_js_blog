import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SectionAdd = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        author
      }),
    });
    if (response.ok) {
      navigate("/");
    } else {
      alert("Chyba při přidávání sekce.");
    }
  };

  return (
    <div>
      <h2>Přidat sekci</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Název sekce"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Popis sekce"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Autor"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">Přidat</button>
      </form>
    </div>
  );
};

export default SectionAdd;