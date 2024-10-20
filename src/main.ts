import "./style.css";
import defaultUrl from "./assets/default.svg";

import { $, parseForm, setTimer, toUrl, validateUrl, download, getFrame, wrapGif } from "./utils";
import { Buffer } from "buffer";

window.Buffer = Buffer;

const form = $("#form") as HTMLFormElement;
const inputWidth = $("#field-width") as HTMLInputElement;
const inputHeight = $("#field-height") as HTMLInputElement;
const inputCheck = $("#field-original") as HTMLInputElement;
const inputFile = $("#input-file") as HTMLInputElement;
const textSource = $("#field-source") as HTMLTextAreaElement;
const imagePreview = $("#image-preview") as HTMLImageElement;

imagePreview.src = defaultUrl;

inputCheck.onchange = () => {
  if (inputCheck.checked) {
    inputWidth.disabled = true;
    inputHeight.disabled = true;
  } else {
    inputWidth.disabled = false;
    inputHeight.disabled = false;
  }
};

inputFile.onchange = () => {
  const file = inputFile.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const source = reader.result as string;
    textSource.value = source;
    textSource.dispatchEvent(new Event("input"));
  };
  reader.readAsText(file);
};

textSource.oninput = async () => {
  const url = toUrl(textSource.value);
  const valid = await validateUrl(url);
  if (valid) {
    imagePreview.src = url;
  } else {
    imagePreview.src = defaultUrl;
  }
};

form.onsubmit = async (ev) => {
  ev.preventDefault();

  const data = parseForm(form);
  const original = data["?original"];
  const width = original ? undefined : data[":width"] || undefined;
  const height = original ? undefined : data[":height"] || undefined;
  const duration = data[":duration"];
  const begin = data[":begin"];
  const interval = data[":interval"];
  const source = data["$source"];
  const src = source && toUrl(source);

  if (
    (!original && width === undefined && height === undefined) ||
    duration === undefined ||
    begin === undefined ||
    interval === undefined ||
    !src ||
    begin > duration ||
    !(await validateUrl(src))
  ) {
    alert("Invalid input");
    return;
  }

  const image = $("<img>") as HTMLImageElement;
  image.className = "ghost";
  width && (image.width = width);
  height && (image.height = height);
  document.body.appendChild(image);

  const repeat = Math.floor((duration - begin) / interval);
  const canvasList: HTMLCanvasElement[] = [];
  image.onload = async () => {
    await setTimer(
      () => {
        canvasList.push(getFrame(image));
      },
      repeat,
      interval,
      begin
    );
    image.remove();
    const gif = await wrapGif(canvasList, interval);
    download(gif.buffer, `${Date.now()}.gif`);
  };
  image.src = src;
};
