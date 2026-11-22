import { getReleaseInfo } from '../utils/release';

const REPO_URL = 'https://github.com/wentbackward/world-cal';

/**
 * Footer pinned to the bottom of the app — the version as tagged, the tag's
 * release date, and the link back to the repository. The date is omitted on
 * builds that carry no tag (dev builds) rather than guessed.
 */
export default function ReleaseFooter() {
  const { version, date } = getReleaseInfo();
  return (
    <footer className="app-footer">
      <span className="app-footer-version">v{version}</span>
      {date && <span> · released {date}</span>}
      <span> · </span>
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        GitHub
      </a>
    </footer>
  );
}
