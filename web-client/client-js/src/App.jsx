import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import PostList from './Posts/PostList';
import SectionSidebar from './Section/SectionSidebar';
import PostDetail from './Posts/PostDetail';
import PostEdit from './Posts/PostEdit';
import PostAdd from './Posts/PostAdd';
import SectionAdd from './Section/SectionAdd';
import SectionEdit from './Section/SectionEdit';
import { Link } from "react-router-dom";

function App() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);

  // Načtení sekcí z API (příklad endpointu)
  useEffect(() => {
    fetch('/api/sections')
      .then(res => res.json())
      .then(data => setSections(data))
      .catch(() => setSections([]));
  }, [location.pathname]);// Znovu načíst sekce při změně cesty

  return (
    <Router>
      <nav className="navbar navbar-expand-sm bg-dark navbar-dark">
        <div className="container-fluid">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="navbar-brand" href="#">
                <img
                  src="/vite.svg"
                  alt="Logo"
                  width="30"
                  height="30"
                  className="d-inline-block align-top"
                  style={{ marginRight: 8 }}
                />Vite Blog
              </a>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Menu</a>
              <ul className="dropdown-menu">
                <li><a className="dropdown-item" href="/">Home</a></li>
                <li> <Link to="/sections/add" className="dropdown-item">
                  Přidat sekci
                    </Link>
                </li>
                <li>
                  <Link to="/add" className="dropdown-item">
                    Přidat článek
                  </Link>
                </li>
                <li><a className="dropdown-item" href="#">About</a></li>
              </ul>
            </li>
          </ul>
          <form className="d-flex ms-4" role="search">
            <input className="form-control me-2" type="text" placeholder="Search" />
            <button className="btn btn-primary" type="button">Search</button>
          </form>
        </div>
      </nav>
      <div className="container-fluid" style={{ display: "flex", minHeight: "80vh" }}>
        <SectionSidebar
          sections={sections}
          onSelect={setSelectedSection}
          selectedSection={selectedSection}
        />
        <main style={{ flex: 1, padding: 24, minHeight: 400 }}>

          <Routes>
            <Route path="/" element={<PostList sectionId={selectedSection} />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/posts/:id/edit" element={<PostEdit />} />
            <Route path="/add" element={<PostAdd />} />
            <Route path="/section/add" element={<SectionAdd />} />
            <Route path="/section/:id/edit" element={<SectionEdit />} />
            <Route path="/sections/add" element={<SectionAdd />} />
            <Route path="/sections/:id/edit" element={<SectionEdit />} />
          </Routes>

        </main>
      </div>
    </Router>
  );
}

export default App
