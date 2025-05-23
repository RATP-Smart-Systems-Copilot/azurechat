import PptxGenJS from "pptxgenjs";
import { getCurrentUser } from "@/features/auth-page/helpers";
import path from "path";
import { Value } from "@radix-ui/react-select";
import { error } from "console";
import { borderBottomLeftRadius } from "html2canvas/dist/types/css/property-descriptors/border-radius";
const fs = require('fs');

export interface SlideTitle{
  title: string;
  subtitle: string;
}

export interface BulletPoint{
  value: string,
  indentLevel: number
}

export interface SlideText{
  text: string;
  bullet: boolean;
  indentlevel: number;
  bold: boolean;

}

export type SlideType = "texton1column" | "textwithChart";
export type ChartType = "area" | "bar"| "bar3d"| "bubble"| "doughnut"| "line"| "pie"| "radar"| "scatter";

export interface Chart{
  chartType: ChartType;
  name: string;
  labels: Array<string>;
  values: Array<number>;
}

export interface BaseSlideContent {
  title: string;
  subtitle?: string;
}

export interface BaseSlideContentText extends BaseSlideContent {
    text_body: SlideText[];
}

// Slide de type "texton1column"
export interface TextOn1ColumnSlide extends BaseSlideContentText {
  type: "texton1column";
  subtitle?: string;
  little_title_section: string;
  text_body: SlideText[];
}

// Slide de type "textwithChart"
export interface TextWithChartSlide extends BaseSlideContentText {
  type: "textwithChart";
  chart: Chart;
  text_body: SlideText[];
}

export interface DividerSlide extends BaseSlideContent {
  type: "dividerSlide";
  numberSection: string
}

export type SlideContent = TextOn1ColumnSlide | TextWithChartSlide | DividerSlide;

export interface SlideSummary{
  sectionTitle: string;
  sectionSubtitle: string;
}

export interface Slides{
  pageTitle: SlideTitle;
  pageSummary: SlideSummary[];
  pageContents: SlideContent[];
}


export const Ppt = async (content: any) : Promise<ArrayBuffer> => {
  const pptx = new PptxGenJS();
  const contentSlides = JSON.parse(content);
  pptx.theme = { headFontFace: "Parisine Office" };
  pptx.theme = { bodyFontFace: "Parisine Office" };
  pptx.layout = "LAYOUT_WIDE";

  initTitleTemplate(pptx);
  initBodyTemplate(pptx);
  if(contentSlides.pageTitle){
    await createSlideTitle(pptx, contentSlides.pageTitle);
  }
  if(contentSlides.pageSummary){
    await createSlideSummary(pptx, contentSlides.pageSummary);
  }

  if(contentSlides.pageContents.length === 0){
    throw error("Erreur lors du traitement.");
  }

  contentSlides.pageContents.forEach(async (slideContent: SlideContent) => {
    switch (slideContent.type) {
      case "texton1column":
        await createSlideText1Column(pptx,slideContent);
        break;
      case "textwithChart":
        await createSlideTextWithChart(pptx,slideContent);
        break;
      case "dividerSlide":
        await createDividerSlide(pptx,slideContent);
        break;
      default:
        await createSlideText1Column(pptx,slideContent);
        break;
      }
  });

  pptx.addSlide({ masterName: "Slide_final" });

  return pptx.write({ outputType: "arraybuffer" }) as unknown as ArrayBuffer;;
};

function getImage64(pathURL: string){
  const imagePath = path.resolve(__dirname, pathURL);
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');
  return 'data:image/png;base64,' + imageBase64;
}
function initTitleTemplate(pptx: PptxGenJS) {
  const imagePathRSS = getImage64('../../../../../../public/ppt/slidelogoRSS.png');
  const imagePathRATP = getImage64('../../../../../../public/ppt/slidelogoRATP.png');
  pptx.defineSlideMaster({
    title: "Slide_titre",
    background: { "color": "64C3B9" },
    objects: [
        { rect: { x: 0.3, y: 0.3, w: 12.6, h: 6.9, fill: { color: '64C3B9' }, line: { color: 'FFFFFF', width: 3 } } },
        { rect: { x: 0.8, y: 0, w: 4, h: 2, fill: { color: '64C3B9' } } },
        { image: {data: imagePathRSS,  x: 0.55, y: -0.2, w: 4.5, h: 1.5}},
        { image: {data: imagePathRATP,  x: 10.95, y: 5.92, w: 2, h: 1.3}},
        {
          placeholder: {
            options: { name: "title", type: "title", x: 0.6, y: 2.5, w: 12, h: 1, color: "FFFFFF", align: "left", valign:"bottom", fontSize:40, fontFace: "Parisine Office"},
            text: "(custom placeholder text!)",
          }
        },
        {
          placeholder: {
            options: { name: "subtitle", type: "body", x: 0.6, y: 3.2, w: 12, h: 1, color: "FFFFFF", align: "left", fontSize:30 },
            text: "(custom placeholder text!)",
          }
        },
        {
          placeholder: {
            options: { name: "author", type: "body", x: 0.6, y: 6.5, w: 12, h: 0.5, color: "FFFFFF", fontSize:18},
            text: "(custom placeholder text!)",
          }
        },
        {
          placeholder: {
            options: { name: "date", type: "body", x: 0.6, y: 6.8, w: 12, h: 0.5, color: "FFFFFF", fontSize:18 },
            text: "(custom placeholder text!)",
          }
        },
       ],
  });
  pptx.defineSlideMaster({
    title: "Slide_summary",
    background: { "color": "64C3B9" },
    objects: [
        { rect: { x: 0.3, y: 0.3, w: 12.55, h: 6.9, fill: { color: '64C3B9' }, line: { color: 'FFFFFF', width: 3 } } },
        { rect: { x: 0, y: 0, w: 13.4, h: 1.3, fill: { color: 'FFFFFF' } } },
        { text: { text: "Sommaire", options: { x: 0.7, y: 0.6, w: 12, h: 0.5, color: "0A0082", fontSize:48, bold:true } } },
       ],
  });

  pptx.defineSlideMaster({
    title: "Slide_divider",
    background: { "color": "64C3B9" },
    objects: [
        { rect: { x: 0.3, y: 0.3, w: 12.6, h: 6.9, fill: { color: '64C3B9' }, line: { color: 'FFFFFF', width: 3 } } },
        {
          placeholder: {
            options: { name: "number", type: "body", x: 0.6, y: 1.5, w: 4, h: 6, color: "FFFFFF", fontSize:200 },
            text: "(number section!)",
          }
        },
        {
          placeholder: {
            options: { name: "title", type: "body", x: 4.5, y: 1, w: 7, h: 3, color: "FFFFFF", valign:"bottom", fontSize:40, bold:true },
            text: "(title!)",
          }
        },
        {
          placeholder: {
            options: { name: "subtitle", type: "body", x: 4.5, y: 4, w: 7, h: 2, color: "FFFFFF", valign:"top", fontSize:30 },
            text: "(subtitle!)",
          }
        },
       ],
  });

  pptx.defineSlideMaster({
    title: "Slide_final",
    background: { "color": "64C3B9" },
    objects: [
        { rect: { x: 0.3, y: 0.3, w: 12.6, h: 6.9, fill: { color: '64C3B9' }, line: { color: 'FFFFFF', width: 3 } } },
        { image: {data: imagePathRSS,  x: 3.5, y: 2.5, w: 6.5, h: 2.5}},

       ],
  });
}

function createDividerSlide(pptx: PptxGenJS, slideContent: DividerSlide) {
  let slide = pptx.addSlide({ masterName: "Slide_divider" });

  slide.addText(slideContent.title, { placeholder: "title" });
  if(slideContent.subtitle)
    slide.addText(slideContent.subtitle, { placeholder: "subtitle" });
  slide.addText(slideContent.numberSection, { placeholder: "number" });

  return pptx;
}

function initBodyTemplate(pptx: PptxGenJS) {
  pptx.defineSlideMaster({
    title: "Slide",
    background: { "color": "FFFFFF" },
    objects: [
        { rect: { x: 0.3, y: 0.3, w: 12.6, h: 6.9, fill: { color: 'FFFFFF' }, line: { color: '0A0082', width: 3 } } },
        {
          placeholder: {
            options: { name: "title", type: "title", x: 0.7, y: 1, w: 12, h: 0.5, color: "0A0082", align: "left", fontSize:28, fontFace: "Parisine Office", bold:true},
            text: "(custom placeholder text!)",
          }
        },
       ],
  });
}

async function createSlideTitle(pptx: PptxGenJS, slideContent: any) {
  let slide = pptx.addSlide({ masterName: "Slide_titre" });

  const user = await getCurrentUser();
  const now = new Date();
  const monthYear = now.toLocaleDateString('fr-FR'); // Récupère le mois et l'année

// Combine le jour, le mois et l'année
const formattedDate = `${monthYear.split(' ')[0]}`;

  slide.addText(slideContent.title, { placeholder: "title" });
  slide.addText(slideContent.subtitle, { placeholder: "subtitle" });
  slide.addText(user.name, { placeholder: "author" });
  slide.addText(formattedDate, { placeholder: "date" });

  return pptx;
}



function createSlideText1Column(pptx: PptxGenJS,slideContent: TextOn1ColumnSlide) {
  let slideBody = pptx.addSlide({ masterName: "Slide" });

  slideBody.addText(slideContent.title, { placeholder: "title" });
  if(slideContent.subtitle)
    slideBody.addText(slideContent.subtitle, {x: 0.7, y: 1.4, w: 12, h: 0.5, color: "F0AA00", align: "left", fontSize:16 });
  if(slideContent.little_title_section)
    slideBody.addText(slideContent.little_title_section, { x: 0.7, y: 2, w: 12, h: 0.5, color: "F0AA00", align: "left", fontSize:24, bold:true });

  generateText(slideContent, slideBody, {x: 0.7, y: 2.4, w: 12, h:0});
  slideBody.slideNumber = { x: 0.55, y: 6.9, fontSize:10, color:"0A0082" };

  return pptx;
}

function createSlideTextWithChart(pptx: PptxGenJS, slideContent: TextWithChartSlide) {
  let slideBody = pptx.addSlide({ masterName: "Slide" });

  slideBody.addText(slideContent.title, { placeholder: "title" });
  if(slideContent.subtitle)
    slideBody.addText(slideContent.subtitle, { x: 0.7, y: 1.4, w: 12, h: 0.5, color: "F0AA00", align: "left", fontSize:16});

  //Text section
  generateText(slideContent, slideBody, {x: 8, y: 2.4, w: 4, h:0});
  slideBody.slideNumber = { x: 0.55, y: 6.9, fontSize:10, color:"0A0082" };

 // Chart section
 const chart = slideContent.chart;
  if(!chart){
    return pptx;
  }
  let dataChart = [{
    name: chart.name,
    labels: chart.labels,
    values: chart.values

  }]

  slideBody.addChart(pptx.ChartType[chart.chartType], dataChart,
    {x: 0.7, y: 2.5, w: 6, h: 4,
      chartColors: ['EBA0C8', 'F5D750', 'AFE1FA', '9BD2C8' ],
      showLegend:true,
      showValue:true
    })

  return pptx;
}

function generateText(slideContent: BaseSlideContentText, slideBody: PptxGenJS.Slide, position: { x: number; y: number; w: number; h:number }){
  let textJson: string | PptxGenJS.TextProps[] = [];
  let height : number = position.h;
  slideContent.text_body.forEach((slideText: SlideText) => {
    if(slideText.bullet){
      let codeBullet = '25BA';
      if(slideText.indentlevel > 1){
        codeBullet = slideText.indentlevel === 2 ? '25CF' : '25A0';
      }
      textJson.push(
        {text: ' ', options: {bullet: {code: codeBullet}, fontSize:16, color: "D75A19", indentLevel: slideText.indentlevel}},
        {text: slideText.text, options: { fontSize:16, color: "0A0082", bold: slideText.bold, indentLevel: slideText.indentlevel, breakLine:true}}
      );
    }else{
      textJson.push({text: slideText.text, options: {bold: slideText.bold, color: "0A0082", indentLevel: slideText.indentlevel, breakLine:true}});
    }
    height += 0.5;
  });
  slideBody.addText(textJson, {x: position.x, y: position.y, w: position.w, h:height});

}

function createSlideSummary(pptx: PptxGenJS, pageSummary: SlideSummary[]) {
  let slide = pptx.addSlide({ masterName: "Slide_summary" });

  // Position initiale et espacement vertical entre sections
  const startXNumber = 0.5; // Position X des numéros
  const startY = 2;       // Position Y de la première section
  const lineHeight = 1.2;   // Espacement vertical entre sections


  pageSummary.forEach((section, index) => {
      // Calcul de la ligne : chaque ligne contient 2 numéros
    const lineNumber = Math.floor(index / 2);
    const posY = startY + lineNumber * lineHeight;
    // Définir la position X selon que le numéro est pair ou impair
    const posXNumber = ( (index + 1) % 2 === 0 ) ? 6 : startXNumber;

    // Numéro de section
    slide.addText(index + 1 < 10 ? `0${index + 1}.` : `${index + 1}.`, {
      x: posXNumber,
      y: posY,
      w: 1.5,
      h: 1,
      fontSize: 62,
      color: "FFFFFF",
      bold: true,
      align: "right",
    });

    // Titre et sous-titre
    const textJson: PptxGenJS.TextProps[] = [
      { text: section.sectionTitle, options: { fontSize: 20, color: "FFFFFF", bold: true, breakLine: true } },
      { text: section.sectionSubtitle, options: { fontSize: 16, color: "FFFFFF", breakLine: true } },
    ];

    slide.addText(textJson, {
      x: posXNumber+1.5,
      y: posY,
      w: 4,
      h: 1,
      align: "left",
    });
  });

  return pptx;
}
