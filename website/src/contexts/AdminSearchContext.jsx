import { createContext, useContext, useState } from "react";

const AdminSearchContext = createContext();

export function AdminSearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Tìm kiếm...");
  const [isSearchVisible, setIsSearchVisible] = useState(true);

  return (
    <AdminSearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchPlaceholder,
        setSearchPlaceholder,
        isSearchVisible,
        setIsSearchVisible
      }}
    >
      {children}
    </AdminSearchContext.Provider>
  );
}

export function useAdminSearch() {
  return useContext(AdminSearchContext);
}
