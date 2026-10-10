import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import styles from './SnippetForm.module.css';

const LANGUAGES = [
  'plaintext', 'javascript', 'typescript', 'python', 'java', 'c', 'cpp',
  'csharp', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'bash',
  'sql', 'html', 'css', 'json', 'yaml', 'markdown', 'prompt',
];

const EMPTY = { title: '', content: '', language: 'plaintext', tags: '', description: '' };

export default function SnippetForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        content: initial.content || '',
        language: initial.language || 'plaintext',
        tags: Array.isArray(initial.tags) ? initial.tags.join(', ') : '',
        description: initial.description || '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }

    const payload = {
      title: form.title.trim(),
      content: form.content,
      language: form.language,
      description: form.description.trim(),
      // Split comma-separated tags, lowercase and trim each
      tags: form.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    };

    onSubmit(payload);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{initial ? 'Edit snippet' : 'New snippet'}</h2>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Title */}
          <div className={styles.field}>
            <label htmlFor="sf-title">Title *</label>
            <input
              id="sf-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Debounce function"
              disabled={loading}
              maxLength={100}
            />
          </div>

          {/* Language */}
          <div className={styles.field}>
            <label htmlFor="sf-language">Language</label>
            <select
              id="sf-language"
              name="language"
              value={form.language}
              onChange={handleChange}
              disabled={loading}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label htmlFor="sf-description">Description</label>
            <input
              id="sf-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional short description"
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* Content */}
          <div className={styles.field}>
            <label htmlFor="sf-content">Content *</label>
            <textarea
              id="sf-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Paste your code or prompt here..."
              disabled={loading}
              rows={10}
            />
          </div>

          {/* Tags */}
          <div className={styles.field}>
            <label htmlFor="sf-tags">Tags <span className={styles.hint}>(comma-separated)</span></label>
            <input
              id="sf-tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. react, hooks, performance"
              disabled={loading}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : <><Save size={15} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
