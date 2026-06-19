import { useState, memo } from 'react';
import { copyToClipboard } from '../utils/clipboard';

const ShareButton = memo(() => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={`btn btn--icon ${copied ? 'btn--copied' : ''}`}
      onClick={handleCopy}
      title="Copy shareable link"
      aria-label="Copy shareable link"
    >
      {copied ? '✓' : '🔗'}
    </button>
  );
});

ShareButton.displayName = 'ShareButton';

export default ShareButton;
