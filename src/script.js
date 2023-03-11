// TODO: add templates like meme generator
// TODO: add text positioning support
// TODO: font-awesome config

var canvas = document.getElementById("MainCanvas");
var canvasWrapper = document.getElementById("canvasWrapper");
canvasWrapper.appendChild(canvas);
canvas.width = 500;
canvas.height = 500;
var ctx = canvas.getContext("2d");
var padding = 15;
var textTop = "לכו לעזאזל כולכם";
var textSizeTop = 20;
var image = document.createElement("img");

const DEFAULT_TEXT_POSITION = {
  top: 0,
  left: 0,
  max: canvas.width * .9
}
var textPosition = DEFAULT_TEXT_POSITION;

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

  pickTemplate(index){
    let data = this.#dataList[index];
    if(!data) return;
    this.#_pickTemplate(data.url, data.textPosition);
  }

  #_pickTemplate = (url, newTextPosition) => {
    image.src = url;
    textPosition = newTextPosition;
  }

  addTemplate = (data) => {
    this.#dataList.push(data);
    const { id, url, textPosition } = data
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
    var words = text.split(" ");
    var line = "";

    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + " ";
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
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

    console.log(this.#ctx);

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

image.onload = function (ev) {
  // delete and recreate canvas do untaint it
  canvas.outerHTML = "";
  canvas = document.createElement("canvas");
  canvasWrapper.appendChild(canvas);
  ctx = canvas.getContext("2d");
  canvasManager = new CanvasManager(canvas, ctx);
  document.getElementById("trueSize").click();
  document.getElementById("trueSize").click();
  draw();
};

document.getElementById("imgFile").onchange = function (ev) {
  var reader = new FileReader();
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

document.getElementById("trueSize").onchange = function (ev) {
  if (document.getElementById("trueSize").checked) {
    canvas.classList.remove("fullwidth");
  } else {
    canvas.classList.add("fullwidth");
  }
};

document.getElementById("export").onclick = function () {
  var img = canvas.toDataURL("image/png");
  var link = document.createElement("a");
  link.download = "My Meme";
  link.href = img;
  link.click();

  var win = window.open("", "_blank");
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

  var _textSizeTop = (textSizeTop / 250) * canvas.width;

  canvasManager
    .setImage(image)
    .setStyle("Open Sans", {
      size: _textSizeTop,
      girth: 2,
    })
    .drawText(textTop, textPosition.left, textPosition.top, textPosition.max);
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