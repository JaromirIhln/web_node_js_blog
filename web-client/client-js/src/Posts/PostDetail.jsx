import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(res => res.json())
      .then(data => setPost(data));
  }, [id]);

  const handleDelete = async () => {
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    navigate("/");
  };

  if (!post) return <div>Načítám...</div>;

  return (
    <div>
      <h2>{post.title}</h2>
      <div className="text-muted">{post.author} | {post.date}</div>
      <div style={{ margin: "16px 0" }}>{post.content}</div>
      <Link to={`/posts/${id}/edit`} className="btn btn-warning me-2">Editovat</Link>
      <button onClick={handleDelete} className="btn btn-danger me-2">Smazat</button>
      <Link to="/" className="btn btn-secondary">Zpět</Link>
    </div>
  );
};

export default PostDetail;