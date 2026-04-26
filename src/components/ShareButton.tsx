import { useState, memo } from 'react';

const ShareButton = memo(() => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      className={`btn btn--share ${copied ? 'btn--copied' : ''}`}
      onClick={handleCopy}
      title="Copy shareable link"
    >
      {copied ? '✓ Copied!' : '🔗 Share'}
    </button>
  );
});

ShareButton.displayName = 'ShareButton';

export default ShareButton;
