// Detect any in-app WebView (HashPack, Android Chrome Custom Tab, iOS WKWebView).
// Used to decide whether to open Twitter OAuth in a real browser window and
// where to send the user after a successful X OAuth callback.
//
// Why not just check for "Safari" in the UA? Many WKWebViews deliberately
// include "Safari" in their user-agent string for site-compatibility reasons.
// The reliable signal for a REAL iOS Safari is the presence of "Version/X.X"
// immediately before "Safari/XXX". WKWebViews never include that fragment.
export function isInAppBrowser(): boolean {
  const ua = navigator.userAgent
  // HashPack may inject a window object — check first
  if (typeof (window as any).hashpack !== 'undefined') return true
  // Android WebView always appends " wv" to the UA
  if (/ wv\)/.test(ua)) return true
  // iOS: is it an iPhone/iPad/iPod that is NOT real Mobile Safari?
  // Real Safari always contains "Version/X.X" (e.g. "Version/17.0").
  // WKWebViews on iOS lack this fragment.
  if (/iPhone|iPad|iPod/.test(ua) && !/Version\/\d+\.\d+/.test(ua)) return true
  return false
}
