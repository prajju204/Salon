import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname);
const outputFile = path.join(__dirname, 'Luxe_Groom_Project_Report_Latest.doc');

// Read all markdown files
const files = [
  'Abstract.md',
  'Acknowledgments.md',
  'Table_Of_Contents.md',
  'Chapter_1_Introduction.md',
  'Chapter_2_Literature_Review.md',
  'Chapter_3_System_Analysis.md',
  'Chapter_4_Design_And_Methodology.md',
  'Chapter_5_Implementation_Details.md',
  'Chapter_6_Result_And_Evaluation.md',
  'Chapter_7_Conclusion_And_Future_Work.md',
  'References.md',
  'Appendices.md'
];

let combinedMarkdown = '';

files.forEach(file => {
  const filePath = path.join(inputDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    combinedMarkdown += content + '\n\n<br style="page-break-before: always">\n\n';
  }
});

// Convert to HTML
const htmlContent = marked.parse(combinedMarkdown);

// Wrap in Word-compatible HTML format
const wordDoc = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>Luxe Groom Project Report</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
  h1 { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 24pt; page-break-before: always; }
  h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; }
  h3 { font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 8pt; }
  h4 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
  p { margin-bottom: 12pt; text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
  th, td { border: 1px solid black; padding: 6pt; text-align: left; }
  th { background-color: #f2f2f2; font-weight: bold; }
  ul, ol { margin-bottom: 12pt; padding-left: 24pt; }
  li { margin-bottom: 6pt; text-align: justify; }
</style>
</head>
<body>
<div style="text-align: center; margin-top: 100px;">
  <h1 style="font-size: 36pt; page-break-before: avoid;">PROJECT REPORT</h1>
  <br><br>
  <h2 style="font-size: 24pt;">"LUXE GROOM - Premium Salon Booking & E-commerce System"</h2>
  <br><br><br>
  <p style="text-align: center; font-size: 14pt;">Submitted By</p>
  <h3 style="font-size: 18pt;">[Your Name]</h3>
  <p style="text-align: center; font-size: 14pt;">[Your Reg No/ID]</p>
  <br><br><br>
  <p style="text-align: center; font-size: 14pt;">Under the guidance of</p>
  <h3 style="font-size: 18pt;">[Guide Name]</h3>
</div>
<br style="page-break-before: always">
${htmlContent}
</body>
</html>
`;

fs.writeFileSync(outputFile, wordDoc, 'utf-8');
console.log('Successfully generated Luxe_Groom_Project_Report.doc');
