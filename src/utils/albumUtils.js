export const isPhotoUrl = (p) =>
    typeof p === "string" &&
    (p.startsWith("blob:") ||
      p.startsWith("data:") ||
      p.startsWith("http"));
  
  export const isPhotoCrop = (p) =>
    p &&
    typeof p === "object" &&
    (p.square || p.album);
  
  export const photoSquare = (p) => {
    if (isPhotoCrop(p)) return p.square || null;
    if (isPhotoUrl(p)) return p;
    return null;
  };
  
  export const photoAlbum = (p) => {
    if (isPhotoCrop(p)) return p.album || null;
    if (isPhotoUrl(p)) return p;
    return null;
  };
  
  export const photoThumb = (p) =>
    photoSquare(p) || photoAlbum(p);
  
  export function compressImageFile(
    file,
    maxSide = 960,
    quality = 0.72
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        const img = new Image();
  
        img.onload = () => {
          const scale = Math.min(
            1,
            maxSide / Math.max(img.width, img.height)
          );
  
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
  
          const canvas =
            document.createElement("canvas");
  
          canvas.width = w;
          canvas.height = h;
  
          canvas
            .getContext("2d")
            .drawImage(img, 0, 0, w, h);
  
          resolve(
            canvas.toDataURL(
              "image/jpeg",
              quality
            )
          );
        };
  
        img.onerror = reject;
        img.src = reader.result;
      };
  
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  export function buildAlbumPages(entries) {
    const pages = [];
  
    pages.push({
      type: "cover",
      id: "cover",
    });
  
    const albumEntries = entries.filter(
      (e) =>
        e.type !== "moment" &&
        (e.text?.trim() ||
          (e.photos &&
            e.photos.length > 0))
    );
  
    const byWeek = albumEntries.reduce(
      (a, e) => {
        if (!a[e.week]) a[e.week] = [];
        a[e.week].push(e);
        return a;
      },
      {}
    );
  
    let pg = 2;
  
    Object.entries(byWeek)
      .sort(
        ([a], [b]) =>
          Number(a) - Number(b)
      )
      .forEach(([week, wentries]) => {
        wentries.forEach((entry) =>
          pages.push({
            type: "entry",
            id: `e-${entry.id}`,
            entry,
            week: Number(week),
            pg: pg++,
          })
        );
      });
  
    pages.push({
      type: "closing",
      id: "closing",
      count: albumEntries.length,
      weeks: Object.keys(byWeek).length,
    });
  
    return pages;
  }