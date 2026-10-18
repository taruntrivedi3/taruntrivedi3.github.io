# Tarun Trivedi's personal site

A small static site using HTML and CSS. There are no packages to install or build
steps. The home page has a portrait on the left and the name and bio on the right;
it stays in two columns down to 480 pixels wide. Below that, a smaller portrait
stacks above the bio. Projects and writing are empty starting
points. Nature contains three
photo albums: Colorado 2026 (5 photos), Patagonia 2026 (6), and Starved Rock 2026
(8).

## Preview

From this directory, run:

```sh
python3 preview.py
```

Open <http://localhost:47391>. If the workspace is on a remote machine, forward
port 47391 through your editor or SSH connection first. Serve this directory,
rather than the parent repository. The preview server disables caching for
pages and assets so edits appear consistently when navigating. If the browser
already has an older page cached, reload that page once after switching servers.

## Edit

- `index.html`: portrait, name, bio, and a résumé link to the Google Drive PDF viewer.
- `assets/profile.webp`: the portrait from the Drive folder named Prof.
- `projects.html`, `writing.html`: section pages.
- `readings.html`: bulleted reading lists, grouped by subject and year.
- `photography.html`: the Nature album index.
- `nature/<album>/index.html`: individual albums.
- `assets/nature/<album>/`: smaller previews and larger WebP photographs.
- `gallery.js`: the photo viewer; supports previous/next buttons, arrow keys,
  and Escape to close. Without JavaScript, photos open as ordinary image links.
- `styles.css`: shared typography, spacing, and colors.
- `assets/fonts/`: the self-hosted EB Garamond Latin font and its SIL Open
  Font License. No external font requests are made when viewing the site.

Navigation uses relative links, so the site can also be opened directly from
`index.html` or hosted under a subdirectory. When adding a page, copy an existing
page, update its title and active navigation link, and add it to the `BUILD`
file's static asset list.

## Photographs

The three albums follow the original Drive folder groupings. The site serves its
own image copies and does not depend on Drive to display them. JPEG and HEIC
sources were converted to WebP, with orientation corrected and colors converted
to sRGB. Previews have a maximum edge of 900 pixels; the larger photographs have
a maximum edge of 2400 pixels. Images are never enlarged beyond their source
dimensions. EXIF metadata is omitted from the website copies.

Only previews are cropped by the page layout. Clicking one opens the larger
photograph at its original aspect ratio. Original camera files and the import
manifest are not included in the published site files.

The 20 original photographs, including the homepage portrait, are kept in
`../personal-site-originals/` within this worktree. The optimized website copies
remain in `assets/`; the website does not rely on temporary files.

To add photographs, place both WebP sizes in the album's asset folder, add the
image links with descriptive alt text to its HTML page, update its count and
cover if needed, and add the new assets to `BUILD`.

## Hosting

The site is hosted at <https://taruntrivedi3.github.io/> using GitHub Pages from
the `main` branch of <https://github.com/taruntrivedi3/taruntrivedi3.github.io>.
The `.nojekyll` file enables serving the HTML and CSS directly. Updates pushed
to `main` are deployed by GitHub Pages. The `BUILD` file is only for the local
workspace and is not needed by GitHub Pages.

Every HTML page currently includes `<meta name="robots" content="noindex">` to
discourage search indexing while the site is a draft. Remove it from each page
when search visibility is wanted. This is a search-engine instruction, not
access control. Fonts are self-hosted. Every HTML page includes the Cloudflare
Web Analytics beacon for page views and visits; view reports in the Cloudflare
dashboard. Its site token is a public identifier. The beacon does not add custom
tracking for clicks on the Google Drive resume link.
