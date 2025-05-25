import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SectionEdit = () => {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/sections/${id}`)
      .then(res => res.json())
      .then(data => {
        setName(data.name);
        setDescription(data.description || "");
        setAuthor(data.author || "");
      });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(`/api/sections/${id}`, {
      method: "PUT",
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
      alert("Chyba při editaci sekce.");
    }
  };

  return (
    <div>
      <h2>Editace sekce</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="form-control mb-2"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="text"
          className="form-control mb-2"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Popis sekce"
        />
        <input
          type="text"
          className="form-control mb-2"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">Uložit změny</button>
      </form>
    </div>
  );
};

export default SectionEdit;