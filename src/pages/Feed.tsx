import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { listInscriptions, type Inscription } from "@/lib/api";
import SteleCard from "@/components/SteleCard";
import { Search } from "lucide-react";
import { useState } from "react";

const categories = ["All", "Environment", "Governance", "Conflict", "Misinformation"];

const Feed = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ["inscriptions", activeCategory],
    queryFn: () => listInscriptions(activeCategory),
  });

  const filtered = search.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            The <span className="text-gradient-gold">Record</span>
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Every inscription below is authored by a biometrically verified human and permanently stored on the decentralized web.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-body font-medium tracking-wide uppercase rounded-sm transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "stele-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search inscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-secondary text-foreground text-sm font-body rounded-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
        </motion.div>

        {isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-display text-lg">Loading inscriptions...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-destructive">
            <p className="font-display text-lg">Failed to load feed. Is the server running?</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
              >
                <SteleCard post={post} />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-display text-lg">No inscriptions found.</p>
            <p className="text-sm mt-2">Be the first to inscribe truth.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
