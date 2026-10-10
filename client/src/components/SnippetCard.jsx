import { useState } from 'react';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';
import styles from './SnippetCard.module.css';

export default function SnippetCard({ snippet, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement('textarea');
      ta.value = snippet.content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${snippet.title}"? This cannot be undone.`)) {
      onDelete(snippet._id);
    }
  };

  return (
    <div className={styles.card}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.meta}>
          {snippet.language && (
            <span className={styles.langBadge}>{snippet.language}</span>
          )}
          <h3 className={styles.title}>{snippet.title}</h3>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label="Copy snippet"
          >
            {copied ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => onEdit(snippet)}
            title="Edit snippet"
            aria-label="Edit snippet"
          >
            <Pencil size={15} />
          </button>
          <button
            className={`${styles.iconBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            title="Delete snippet"
            aria-label="Delete snippet"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Description */}
      {snippet.description && (
        <p className={styles.description}>{snippet.description}</p>
      )}

      {/* Code block */}
      <pre className={styles.code}>
        <code>{snippet.content}</code>
      </pre>

      {/* Tags */}
      {snippet.tags?.length > 0 && (
        <div className={styles.tags}>
          {snippet.tags.map((tag) => (
            <span key={tag} className={styles.tag}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
