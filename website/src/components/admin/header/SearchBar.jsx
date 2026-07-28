import { Search, X } from "lucide-react";
import { useAdminSearch } from "../../../contexts/AdminSearchContext";

export default function SearchBar() {
  const { searchQuery, setSearchQuery, searchPlaceholder, isSearchVisible } = useAdminSearch();

  return (
    <div className={`relative flex items-center w-full max-w-[420px] transition-all duration-300 ${!isSearchVisible ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="absolute left-3 text-slate-400 flex items-center pointer-events-none">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full h-10 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all duration-200"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery("")}
          className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
