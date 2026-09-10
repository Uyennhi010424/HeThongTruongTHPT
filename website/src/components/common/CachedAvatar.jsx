import React, { useState, useEffect } from "react";
import { readCachedAvatar } from "../../utils/avatarCache.js";

export default function CachedAvatar({
  username,
  role,
  src,
  fallback,
  className = "",
  fallbackClassName = ""
}) {
  const [avatar, setAvatar] = useState(() => (src || (username ? readCachedAvatar({ username, role }) : null)));
  const [error, setError] = useState(false);

  useEffect(() => {
    const onAvatarChanged = (e) => {
      const detail = e?.detail;
      // If we don't have detail, or it matches this username, update
      if (!detail || !detail.username || !username || detail.username === username) {
        const newAvatar = username ? readCachedAvatar({ username, role }) : null;
        setAvatar(newAvatar);
        setError(false);
      }
    };
    
    // Refresh initially just in case it changed before mount
    const currentAvatar = src || (username ? readCachedAvatar({ username, role }) : null);
    setAvatar(currentAvatar);
    setError(false);

    window.addEventListener("httt_avatar_changed", onAvatarChanged);
    return () => {
      window.removeEventListener("httt_avatar_changed", onAvatarChanged);
    };
  }, [username, role, src]);

  // When username changes, reset error state
  useEffect(() => {
    setError(false);
  }, [username]);

  if (avatar && !error) {
    return (
      <img
        src={avatar}
        alt={username || "avatar"}
        className={`shrink-0 aspect-square object-cover ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`shrink-0 aspect-square flex items-center justify-center ${fallbackClassName}`}>
      {fallback}
    </div>
  );
}
