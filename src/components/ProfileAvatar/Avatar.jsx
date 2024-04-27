import React from "react";

export default function Avatar({ src, selected, setSelectedAvatar, id }) {
  return (
    <div className="profile">
      <button className="profile-btn" onClick={() => setSelectedAvatar(id)}>
        <img src={src} className="profile-img" style={{ border: selected && "1px solid blue" }} />
      </button>
    </div>
  );
}
