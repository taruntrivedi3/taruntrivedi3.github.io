const viewer = document.querySelector("#photo-viewer");
const photos = Array.from(document.querySelectorAll("[data-photo]"));

if (viewer && typeof viewer.showModal === "function" && photos.length) {
  const image = viewer.querySelector(".viewer-image");
  const caption = viewer.querySelector(".viewer-caption");
  const counter = viewer.querySelector(".viewer-counter");
  let current = 0;
  let opener;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.src = photo.href;
    image.alt = photo.querySelector("img").alt;
    caption.textContent = image.alt;
    counter.textContent = `${current + 1} / ${photos.length}`;
  }

  photos.forEach((photo, index) => {
    photo.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      opener = photo;
      showPhoto(index);
      viewer.showModal();
      document.body.classList.add("viewer-open");
    });
  });

  viewer.querySelector("[data-close]").addEventListener("click", () => viewer.close());
  viewer.querySelector("[data-previous]").addEventListener("click", () => showPhoto(current - 1));
  viewer.querySelector("[data-next]").addEventListener("click", () => showPhoto(current + 1));
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  viewer.addEventListener("click", (event) => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      viewer.close();
    }
  });
  viewer.addEventListener("close", () => {
    document.body.classList.remove("viewer-open");
    image.removeAttribute("src");
    opener.focus({ preventScroll: true });
  });
}
