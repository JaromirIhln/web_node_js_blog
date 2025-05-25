import React from "react";
import { Link } from "react-router-dom";

const SectionSidebar = ({ sections, onSelect, selectedSection }) => (
  <aside style={{ width: 240, borderRight: "1px solid #ddd", padding: 16 }}>
    <h3 className="text-bg-primary rounded rounded-2 p-2">Sekce článků</h3>
    <ul style={{ listStyle: "none", padding: 0 }}>
      {sections.map((section) => (
        <li
          key={section.id}
          style={{
            margin: "4px 6px 6px 0",
            background: selectedSection === section.id ? "#f0f8ff" : "transparent",
            padding: "8px 2px 4px 6px",
            borderBottom: "1px solid #ddd",
            cursor: "pointer",
            fontWeight: selectedSection === section.id ? "bold" : "fw-semibold",
            color: selectedSection === section.id ? "#007bff" : "inherit"
          }}
          onClick={() => onSelect(section.id)}
        >
          {section.name}
          <Link to={`/sections/${section.id}/edit`} className="btn btn-sm btn-warning ms-3 me-3">Editovat</Link>
        </li>
      ))}
    </ul>
  </aside>
);

export default SectionSidebar;