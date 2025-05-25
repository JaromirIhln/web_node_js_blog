import React, { useEffect, useState } from "react";
import { fetchApiData } from "../utils/api";

const PostList = ({ sectionId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sectionId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchApiData(`/api/sections/${sectionId}/posts`)
      .then((data) => setPosts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sectionId]);

  if (!sectionId) return <div>Vyber sekci vlevo.</div>;
  if (loading) return (
    <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      Načítám příspěvky...
    </div>
  );
  if (error) return <div>Chyba: {error}</div>;
  if (posts.length === 0) return <div>V této sekci nejsou žádné příspěvky.</div>;

  return (
    <ul className="list-unstyled">
      {posts.map((post) => (
        <li key={post.id} className="mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{post.title}</h5>
              <h6 className="card-subtitle mb-2 text-muted">
                {post.author} | {post.date}
              </h6>
              <p
                className="card-text"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {post.content}
              </p>
              <a href={`/posts/${post.id}`} className="card-link">
                Číst dále…
              </a>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PostList;