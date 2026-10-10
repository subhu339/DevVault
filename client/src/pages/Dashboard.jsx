import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import SnippetCard from '../components/SnippetCard';
import SnippetForm from '../components/SnippetForm';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Search + filter state
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Fetch snippets on mount
  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/snippets');
      setSnippets(data.snippets || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load snippets.');
    } finally {
      setLoading(false);
    }
  };

  // Derive unique languages and tags from loaded snippets for filter dropdowns
  const allLanguages = useMemo(() => {
    const langs = snippets.map((s) => s.language).filter(Boolean);
    return [...new Set(langs)].sort();
  }, [snippets]);

  const allTags = useMemo(() => {
    const tags = snippets.flatMap((s) => s.tags || []);
    return [...new Set(tags)].sort();
  }, [snippets]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return snippets.filter((s) => {
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q);
      const matchesLang = !langFilter || s.language === langFilter;
      const matchesTag = !tagFilter || (s.tags || []).includes(tagFilter);
      return matchesSearch && matchesLang && matchesTag;
    });
  }, [snippets, search, langFilter, tagFilter]);

  // Create
  const handleCreate = async (payload) => {
    setFormLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/snippets', payload);
      setSnippets((prev) => [data.snippet, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create snippet.');
    } finally {
      setFormLoading(false);
    }
  };

  // Update
  const handleUpdate = async (payload) => {
    setFormLoading(true);
    setError('');
    try {
      const { data } = await api.put(`/api/snippets/${editTarget._id}`, payload);
      setSnippets((prev) =>
        prev.map((s) => (s._id === editTarget._id ? data.snippet : s))
      );
      setEditTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update snippet.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/snippets/${id}`);
      setSnippets((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete snippet.');
    }
  };

  const openEdit = (snippet) => {
    setEditTarget(snippet);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  return (
    <div className={styles.layout}>
      <Navbar />

      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>My Snippets</h1>
            <span className={styles.count}>{snippets.length} saved</span>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            New snippet
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBox}>
            {error}
            <button className={styles.dismissErr} onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Search + filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by title, content, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filters}>
            <SlidersHorizontal size={14} className={styles.filterIcon} />
            <select
              className={styles.filterSelect}
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
            >
              <option value="">All languages</option>
              {allLanguages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>#{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className={styles.center}>
            <span className={styles.spinner} />
            <p>Loading snippets…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {snippets.length === 0 ? (
              <>
                <span className={styles.emptyIcon}>{'</>'}</span>
                <p>No snippets yet.</p>
                <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                  <Plus size={15} /> Add your first snippet
                </button>
              </>
            ) : (
              <p>No snippets match your search or filters.</p>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((s) => (
              <SnippetCard
                key={s._id}
                snippet={s}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create form */}
      {showForm && (
        <SnippetForm
          initial={null}
          onSubmit={handleCreate}
          onCancel={closeForm}
          loading={formLoading}
        />
      )}

      {/* Edit form */}
      {editTarget && (
        <SnippetForm
          initial={editTarget}
          onSubmit={handleUpdate}
          onCancel={closeForm}
          loading={formLoading}
        />
      )}
    </div>
  );
}
