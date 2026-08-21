import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { QuoteDocument } from "./src/components/pdf/quote-document";
import { PDF_QA_FIXTURES } from "./scripts/pdf/fixtures";

const OUTPUT_DIRECTORY = resolve("tmp/pdfs/qa");

async function generateTestPdfs() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true });

  for (const fixture of PDF_QA_FIXTURES) {
    const outputPath = resolve(OUTPUT_DIRECTORY, `${fixture.name}.pdf`);
    await renderToFile(<QuoteDocument {...fixture.props} />, outputPath);
    console.log(outputPath);
  }
}

generateTestPdfs().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
