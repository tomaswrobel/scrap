import type {APIRoute} from "astro";
import type {GitHubAPIRelease} from "../../web/utils/GithubAPIRelease";

const PLATFORM_MAP: Record<string, RegExp> = {
	windows: /Scrap.*\.msi$/i,
	macos: /Scrap.*\.dmg$/i,
	linux: /Scrap.*\.AppImage$/i,
	debian: /Scrap.*\.deb$/i,
	fedora: /Scrap.*\.rpm$/i,
};

export const GET: APIRoute = async ({url}) => {
	const platform = url.searchParams.get("platform");
	if (!platform || !(platform in PLATFORM_MAP)) {
		return new Response("Missing or invalid platform", {status: 400});
	}

	// Fetch latest release from GitHub API
	const res = await fetch("https://api.github.com/repos/tomaswrobel/scrap/releases/latest", {
		headers: {Accept: "application/vnd.github+json"},
	});
	if (!res.ok) {
		return new Response("Failed to fetch release info", {status: 502});
	}
	const release: GitHubAPIRelease = await res.json();
	const asset = release.assets.find(a => PLATFORM_MAP[platform].test(a.name));
	if (!asset) {
		return new Response("No asset found for this platform", {status: 404});
	}
	return Response.redirect(asset.browser_download_url, 302);
};

export const prerender = false;
