function attachmentToSlide(attachment, fallbackAlt = "") {
  if (!attachment) return null;
  const thumb = attachment.thumbnails?.large || attachment.thumbnails?.full || attachment.thumbnails?.small || {};
  const url = thumb.url || attachment.url;
  if (!url) return null;
  const mime = attachment.type || "";
  return {
    id: attachment.id || url,
    type: mime.startsWith("video/") ? "VIDEO" : "IMAGEN",
    url,
    downloadUrl: attachment.url,
    alt: fallbackAlt || attachment.filename || "Contenido multimedia",
    title: attachment.filename || "",
    width: thumb.width || attachment.width,
    height: thumb.height || attachment.height,
  };
}

export function imageToSlide(image, fallbackAlt = "") {
  if (!image) return null;
  if (typeof image === "string") {
    return { id: image, type: "IMAGEN", url: image, alt: fallbackAlt || "Imagen" };
  }
  if (Array.isArray(image)) {
    return attachmentToSlide(image[0], fallbackAlt);
  }
  return attachmentToSlide(image, fallbackAlt);
}

export function normalizePublicMedia(item, fallbackAlt = "") {
  if (!item) return null;
  const attachment = item.attachment || (Array.isArray(item.attachments) ? item.attachments[0] : null);
  const url = item.url || attachment?.url || attachment?.download_url;
  if (!url) return null;
  const type = String(item.type || attachment?.type || "IMAGEN").toUpperCase();
  return {
    id: item.id || url,
    type: type.includes("VIDEO") ? "VIDEO" : type.includes("EMBED") ? "EMBED" : "IMAGEN",
    role: item.role || "CARRUSEL",
    url,
    alt: item.alt || fallbackAlt || item.title || "Contenido multimedia",
    title: item.title || "",
    description: item.description || "",
    order: Number(item.order || 0),
    width: attachment?.width,
    height: attachment?.height,
  };
}

export function mediaSlidesFrom({ media = [], images = [], fallbackAlt = "" } = {}) {
  const mediaSlides = (Array.isArray(media) ? media : [])
    .map((item) => normalizePublicMedia(item, fallbackAlt))
    .filter(Boolean);
  const imageSlides = (Array.isArray(images) ? images : [images])
    .flat()
    .map((image) => imageToSlide(image, fallbackAlt))
    .filter(Boolean);

  const seen = new Set();
  return [...mediaSlides, ...imageSlides]
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .filter((slide) => {
      if (!slide.url || seen.has(slide.url)) return false;
      seen.add(slide.url);
      return true;
    });
}
