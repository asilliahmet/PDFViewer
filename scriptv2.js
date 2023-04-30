async function getPDFFromUrl(url) {
  console.log("response reached");
  const response = await fetch(url);
  console.log(response);
  const data = await response.blob();
  return convertBlobToPDF(data);
}

async function convertBlobToPDF(blob) {
  const pdfData = new Uint8Array(await blob.arrayBuffer());
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdfDocument = await loadingTask.promise;
  return pdfDocument;
}
// PDF FROM URL GROUP, NO TOUCHIES

function renderPageToCanvas (canvas, pdf, pageNumber, renderScale) {
  var context = canvas.getContext('2d');
  // Get the specified page
  pdf.getPage(pageNumber).then(function (page) {
    var viewport = page.getViewport({ scale: renderScale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    // Render the page to the canvas
    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    page.render(renderContext);
  });
  canvas.classList.add("rendering");
}
// page renderer, no touchies

function loadBase64Pdf(base64Pdf) {
  return pdfjsLib.getDocument({ data: atob(base64Pdf) }).promise.then(function(pdf) {
    return pdf;
  });
}
// base64 to pdf, no touchies

let pdfAppDiv = document.querySelector("#pdfApp");
pdfAppDiv.innerHTML += `<div id="pdfscroller"><div style="margin: 0px; padding: 0px; width: 100%;" id="contentWidth"></div></div>`;

let pdfFile, pdfScroller, pages, currentPage;

let PDFParams = [
  ["scale","",],
  ["count","",],
  ["contentwidth","",],
  ["aspectrate","",],
  // this is an AAobject
];

let settings = [
  ["renderdist",5],
  ["filename", "/katalog.pdf"],
  // this is an AAobject
];

//PERSONAL LIBRARY STARTS HERE

function AAobj(AAobject, para, edit){
  let AAindex = -1;
  for (let i = 0; i<AAobject.length; i++){
    if (para.toLowerCase() === AAobject[i][0].toLowerCase()) {
      AAindex = i;
      break;
    }
  }
  if (AAindex === -1) {
    console.log(`parameter not found ${AAobject} | ${para} | ${edit}`);
    return;
  }
  if (!edit){
    return AAobject[AAindex][1];
    // read mode: x = AAobj(object, parameter)
  }
  else {
    return AAindex;
    // write mode: object[AAobj(object, parameter, 1)][1] = newValue
    // indexof mode: index = AAobj(object, parameter, 1)
  }
}

function absVal(x) {
  if (x>0) return x;
  return -x;
}

function XYLongArray(x,y) {
  if (!y) {
    let onedimarray = [];
    for (let i = 0; i<x; i++){
      onedimarray.push(false);
    }
    return onedimarray;
  }
  let pushrow = XYLongArray(y),
    twodimarray = [];
  for (let i=0; i<x; i++){
    twodimarray.push(pushrow);
  }
  return twodimarray;
}

function aspectWidthHeight(aspect, width, height) {
  // evals the -1 in the aspect = width/height equation
  if (aspect == -1) return width/height;
  if (width == -1) return aspect*height;
  if (height == -1) return width/aspect;
}

//PERSONAL LIBRARY ENDS HERE

async function pageLoads() {
  console.log("loader online");

  // pdfFile = await getPDFFromUrl(location.href + AAobj(settings,"filename"));
  // pdfFile = await getPDFFromUrl("http://majolikahali.com.tr/katalog/katalog.pdf");

  pdfFile = await loadBase64Pdf(pdfData);

  console.log(location.href + AAobj(settings,"filename"));
  console.log(pdfFile);

  let scrollerWidth = document.querySelector("#contentWidth").offsetWidth;

  PDFParams[AAobj(PDFParams,"count",1)][1] = pdfFile.numPages;
  PDFParams[AAobj(PDFParams,"contentwidth",1)][1] = scrollerWidth;

  const firstpage = await pdfFile.getPage(1);
  let pageWidth=0, pageHeight=0;
  pageWidth = firstpage.getViewport({scale:1}).width;
  pageHeight = firstpage.getViewport({scale:1}).height;

  PDFParams[AAobj(PDFParams, "aspectrate", 1)][1] = pageWidth / pageHeight;
  PDFParams[AAobj(PDFParams, "scale", 1)][1] = pageWidth / scrollerWidth;

  let height = aspectWidthHeight(AAobj(PDFParams,"aspectrate"), scrollerWidth, -1);
  pdfScroller = document.querySelector("#pdfscroller");

  for (let i=0,count=AAobj(PDFParams,"count"); i<count; i++){
    let page = document.createElement("canvas");
    page.classList.add("pdfpage");
    page.style.height = `${height}px`;
    pdfScroller.appendChild(page);
  }

  pages = document.querySelectorAll("#pdfscroller canvas");

  currentPage = 1;
  numberToRender(currentPage);

  pdfScroller.addEventListener("scroll", x => scrollHandler(x));
}

function scrollHandler(event){
  let minDist = +Infinity;
  let activeIndex = -1;
  let scrollPos = pdfScroller.scrollTop;

  for (let i = 0; i<pages.length; i++){
    if (absVal(pages[i].offsetTop - scrollPos) < minDist){
      minDist = absVal(pages[i].offsetTop - scrollPos);
      activeIndex = i;
    }
  }

  if (activeIndex+1 != currentPage) {
    currentPage = activeIndex+1;
    numberToRender(currentPage);
  }
}

function numberToRender(activepage) {
  let rendervector = (AAobj(settings,"renderdist")-1)/2;
  let scale = AAobj(PDFParams, "scale");

  for (let i= pages.length; i>0; i--){
    if (absVal(activepage - (i)) > rendervector) {
      noRender(pages[i-1]);
      continue;
    }
    if (!(pages[i-1].classList.contains("rendering"))){
      renderPageToCanvas(pages[i-1], pdfFile, i, scale);
    }
  }
}

function noRender(elem) {
  if (!(elem.classList.contains("rendering"))) return;
  targetContext = elem.getContext("2d");
  targetContext.clearRect(0,0,elem.width, elem.height);
  elem.classList.remove("rendering");
}

pageLoads();
