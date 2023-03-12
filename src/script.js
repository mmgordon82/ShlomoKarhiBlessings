// TODO: add templates like meme generator

const shareBtn = document.getElementById("Share");
const errorBody = document.getElementById("MsgBody");
let canvas = document.getElementById("MainCanvas");
let canvasWrapper = document.getElementById("canvasWrapper");
canvasWrapper.appendChild(canvas);
canvas.width = 500;
canvas.height = 500;
let ctx = canvas.getContext("2d");
let padding = 15;
let textTop = "לכו לעזאזל כולכם";
let textSizeTop = 20;
let image = document.createElement("img");

const DEFAULT_TEXT_POSITION = {
  top: 150,
  left: 550,
  max: canvas.width * 2.3,
};
let textPosition = DEFAULT_TEXT_POSITION;

class TempalteManager {
  #container;
  #groupName;
  #isFirst = true;
  #dataList = [];

  constructor(selector, name = "temaplte-image") {
    this.#groupName = name;
    this.#container = document.querySelector(selector);
    if (!this.#container) {
      throw new Error(`selector "${selector}" not found`);
    }
  }

  async load(route) {
    await fetch(route)
      .then((res) => res.json())
      .then((res) => res.forEach(this.addTemplate));
  }

  pickTemplate(index) {
    let data = this.#dataList[index];
    if (!data) return;
    this.#_pickTemplate(data.url, data.textPosition);
  }

  #_pickTemplate = (url, newTextPosition) => {
    image.src = url;
    textPosition = newTextPosition;
  };

  addTemplate = (data) => {
    this.#dataList.push(data);
    const { id, url, textPosition } = data;
    //input
    const input = document.createElement("input");
    input.hidden = true;
    input.classList.add(`peer/${id}`);
    input.type = "radio";
    input.value = id;
    input.name = this.#groupName;
    input.id = id;
    input.oninput = this.createOnSelectCb(url, textPosition);
    if (this.#isFirst) {
      input.checked = true;
      this.#isFirst = false;
    }

    //image wrapper
    const label = document.createElement("label");
    label.classList.add(
      "cursor-pointer",
      "w-12",
      "h-12",
      "border-blue-500",
      `peer-checked/${id}:cursor-default`,
      `peer-checked/${id}:border-2`
    );
    label.setAttribute("for", id);
    label.setAttribute("data-generated", "true");

    //image
    const img = document.createElement("img");
    img.classList.add("w-full");
    img.src = url;

    label.appendChild(img);

    let container = this.#container;
    let first = container.firstChild;
    container.insertBefore(input, first);
    container.insertBefore(label, first);
  };

  createOnSelectCb = (url, newTextPosition) => () => {
    this.#_pickTemplate(url, newTextPosition);
  };
}

class CanvasManager {
  #ctx;
  #canvasEl;
  #fontSize;
  static DEFAULT_SETTER_OPTIONS = {
    align: "center",
    base: "bottom",
    size: "10px",
    fill: "white",
    stroke: "black",
    girth: 2,
  };

  constructor(canvas) {
    this.#canvasEl = canvas;
    this.#ctx = canvas.getContext("2d");
    this.#fontSize = CanvasManager.DEFAULT_SETTER_OPTIONS.size;
  }

  #wrapText(context, text, x, y, maxWidth, lineHeight) {
    let words = text.split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = context.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }

  setStyle(fontFamily, _options = CanvasManager.DEFAULT_SETTER_OPTIONS) {
    let options = {
      ...CanvasManager.DEFAULT_SETTER_OPTIONS,
      ..._options,
    };

    this.#ctx.font = `${options.size}px ${fontFamily}`;
    this.#ctx.fillStyle = options.fill;
    this.#ctx.textAlign = options.align;
    this.#ctx.textBaseline = options.base;
    this.#ctx.strokeStyle = options.stroke;
    this.#ctx.lineWidth = options.girth;
    this.#fontSize = options.size;

    return this;
  }

  setImage(imageEl) {
    const canvas = this.#canvasEl;
    this.#ctx.drawImage(imageEl, 0, 0, canvas.width, canvas.height);
    return this;
  }

  drawText(
    content,
    x = 0,
    y = 0,
    _maxWidth = undefined,
    _lineHeight = undefined
  ) {
    const ctx = this.#ctx;
    const lh = _lineHeight ?? this.#fontSize * 1.4;
    const maxWidth = _maxWidth ?? this.#canvasEl.width;

    this.#wrapText(ctx, content, x, y, maxWidth, lh);

    return this;
  }
}

let canvasManager = new CanvasManager(canvas, ctx);

function updateCanvas() {
  // delete and recreate canvas do untaint it
  canvas.outerHTML = "";
  canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);
  canvas.classList.add("w-full", "max-w-[500px]", "max-h-[800px]");
  ctx = canvas.getContext("2d");
  canvasManager = new CanvasManager(canvas, ctx);
  draw();
}

image.onload = updateCanvas;

document.getElementById("imgFile").onchange = function (ev) {
  let reader = new FileReader();
  reader.onload = function (ev) {
    image.src = reader.result;
    textPosition = DEFAULT_TEXT_POSITION;
  };
  reader.readAsDataURL(this.files[0]);
};

document.getElementById("textTop").oninput = function (ev) {
  textTop = this.value;
  draw();
};

document.getElementById("textSizeTop").oninput = function (ev) {
  let value = this.value;
  textSizeTop = parseInt(value);
  draw();
  const strValue = value < 10 ? `0${value}` : value.toString();
  document.getElementById("textSizeTopOut").innerHTML = strValue;
};

document.getElementById("export").onclick = function () {
  let img = canvas.toDataURL("image/png");
  let link = document.createElement("a");
  link.download = "My Meme";
  link.href = img;
  link.click();

  let win = window.open("", "_blank");
  win.document.write(
    '<img style="box-shadow: 0 0 1em 0 dimgrey;" src="' + img + '"/>'
  );
  win.document.write(
    '<h1 style="font-family: Helvetica; font-weight: 300">Right Click > Save As<h1>'
  );
  win.document.body.style.padding = "1em";
};

function setContextStyle(ctx, font, size, align = "center", base = "bottom") {
  ctx.font = size + "px " + font;
  ctx.textAlign = align;
  ctx.textBaseline = base;
}

function draw() {
  // set appropriate canvas size
  canvas.width = image.width;
  canvas.height = image.height;

  // styles
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = canvas.width * 0.004;

  let _textSizeTop = (textSizeTop / 250) * canvas.width;

  canvasManager
    .setImage(image)
    .setStyle("Open Sans", {
      size: _textSizeTop,
      girth: 2,
    })
    .drawText(textTop, textPosition.left, textPosition.top, textPosition.max);
}

async function extractSharable(canvasEl = canvas) {
  const url = canvasEl.toDataURL();
  const fetched_url = await fetch(url);
  const blob = await fetched_url.blob();
  const files = [
    new File([blob], "Blessing.png", {
      type: blob.type,
      lastModified: Date.now(),
    }),
  ];

  return { files };
}

async function share(payload) {
  if (!navigator.canShare(payload)) return false;
  try {
    await navigator.share(payload);
    return true;
  } catch (_) {
    return false;
  }
}

function error(msg){
  errorBody.textContent = `*${msg}`;
}

const tempalteManager = new TempalteManager(
  "#templatesContainer",
  "template-image"
);

tempalteManager.load("/templates.json").then(() => {
  tempalteManager.pickTemplate(0);
});

document.getElementById("textSizeTop").value = textSizeTop;
document.getElementById("textSizeTopOut").innerHTML = textSizeTop;
document.getElementById("textTop").value = textTop;
updateCanvas();

shareBtn.addEventListener("click", async () => {
  let content = await extractSharable();
  try{
    await share(content);
  }
  catch(e){
    error('Could not share');
  }
});