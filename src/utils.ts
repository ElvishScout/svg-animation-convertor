import { GifFrame, GifCodec, GifUtil } from "gifwrap";

export const $ = (query: string) => {
  if (query[0] === "<") {
    return document.createElement(query.substring(1, query.length - 1));
  } else {
    return document.querySelector(query);
  }
};

export const parseForm = (form: HTMLFormElement) => {
  const formData = new FormData(form);

  return new Proxy<{
    [key: `:${string}`]: number | undefined;
    [key: `$${string}`]: string | undefined;
    [key: `?${string}`]: boolean | undefined;
    [key: `#${string}`]: File | undefined;
  }>(
    {},
    {
      get(_, p) {
        const key = p.toString();
        const identifier = key[0];
        const name = key.substring(1);
        const data = formData.get(name);

        if (data === null) {
          return undefined;
        }
        if (data instanceof File) {
          if (identifier === "#") {
            return data;
          }
          return undefined;
        }
        switch (identifier) {
          case ":":
            if (data) {
              return parseFloat(data);
            }
            return undefined;
          case "$":
            return data;
          case "?":
            return data === "on";
        }
        return undefined;
      },
    }
  );
};

export const setTimer = async (
  callback: () => void,
  repeat: number,
  interval: number,
  begin: number = 0
) => {
  return new Promise<void>((resolve) => {
    let count = 0;
    let next = Date.now() + begin;
    const action = () => {
      callback();
      const dt = Date.now() - next;
      next += interval;
      if (count++ < repeat) {
        setTimeout(action, Math.max(0, interval - dt));
      } else {
        resolve();
      }
    };
    if (count++ < repeat) {
      setTimeout(action, begin);
    } else {
      resolve();
    }
  });
};

export const toUrl = (source: string) => {
  return "data:image/svg+xml;base64," + btoa(source);
};

export const validateUrl = async (url: string) => {
  return new Promise<boolean>((resolve) => {
    const image = $("<img>") as HTMLImageElement;
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
};

export const download = (data: any, filename: string) => {
  const link = $("<a>") as HTMLAnchorElement;
  link.href = URL.createObjectURL(new Blob([data]));
  link.download = filename;
  link.click();
};

export const getFrame = (image: HTMLImageElement) => {
  const { width, height } = image;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);
  return canvas;
};

export const wrapGif = async (canvasList: HTMLCanvasElement[], interval: number) => {
  const frames = canvasList.map((canvas) => {
    const { width, height } = canvas;
    const context = canvas.getContext("2d")!;
    const array = context.getImageData(0, 0, width, height).data;
    const data = Buffer.from(array);
    const frame = new GifFrame({ width, height, data }, { delayCentisecs: interval / 10 });
    GifUtil.quantizeDekker(frame, 256);
    return frame;
  });
  const codec = new GifCodec();
  return await codec.encodeGif(frames, {});
};
