import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { renderToFile } from "@react-pdf/renderer";
import { QuoteDocument } from "./src/components/pdf/quote-document";
import { PDF_QA_FIXTURES } from "./scripts/pdf/fixtures";

const outputPath = resolve("tmp/pdfs/smoke-standard-v1.pdf");

mkdir(resolve("tmp/pdfs"), { recursive: true })
  .then(() => renderToFile(<QuoteDocument {...PDF_QA_FIXTURES[0].props} />, outputPath))
  .then(() => console.log(outputPath))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
