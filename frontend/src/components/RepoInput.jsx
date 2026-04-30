import { useState } from "react";

const GITHUB_PATTERN = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/;

export default function RepoInput({ onParsed, isLoading }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  function validate(value) {
    if (!value) return "Paste a GitHub repo URL.";
    if (!GITHUB_PATTERN.test(value.trim())) {
      return "Must match: https://github.com/owner/repo";
    }
    return "";
  }

  function handleChange(e) {
    setUrl(e.target.value);
    if (error) setError(validate(e.target.value));
  }

  function handleBlur() {
    setError(validate(url));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate(url);
    if (err) { setError(err); return; }
    onParsed(url.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <label className="block text-sm font-medium text-gray-400 mb-2">
        GitHub Repository URL
      </label>
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="https://github.com/username/repo"
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !!validate(url)}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Analyzing..." : "Analyze Repo"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </form>
  );
}
