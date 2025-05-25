import React from "react";

const SectionList = ({ sections, onSelect, selectedSection }) => (
  <ul style={{ listStyle: "none", padding: 0 }}>
    {sections.map((section) => (
      <li key={section.id}>
        <button
          style={{
            background: selectedSection === section.id ? "#007bff" : "transparent",
            color: selectedSection === section.id ? "#fff" : "#333",
            border: "none",
            padding: "8px 12px",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            borderRadius: 4,
            marginBottom: 4
          }}
          onClick={() => onSelect(section.id)}
        >
          {section.name}
        </button>
      </li>
    ))}
  </ul>
);

export default SectionList;