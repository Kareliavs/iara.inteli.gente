// Vite's `base` is "./" (relative) so the build works from any subpath
// (e.g. GitHub Pages project sites at username.github.io/repo-name/).
// Anything referenced with a literal absolute path like "/logo.png" or
// "/geo/x.geojson" bypasses Vite's asset handling and breaks under that
// subpath. Use withBase("logo.png") instead of "/logo.png" wherever a file
// from /public is referenced directly as a string (img src, fetch, etc).
export const withBase = (relativePath) =>
  `${import.meta.env.BASE_URL}${relativePath.replace(/^\/+/, "")}`;
