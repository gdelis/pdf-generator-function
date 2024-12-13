const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * HTTP Cloud Function to generate a PDF from an external HTML file using input data.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.generatePdf = async (req, res) => {
  try {
    // Validate input
    const { data } = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).send({ error: "Required input data are missing" });
    }

    // Read the external HTML template
    const templatePath = path.join(__dirname, "template.html");
    if (!fs.existsSync(templatePath)) {
      return res.status(500).send({ error: "HTML template file not found" });
    }
    let templateHtml = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders in the template with actual data
    const html = templateHtml
      .replace(/\{\{name\}\}/g, data.name || "Customer")
      .replace(/\{\{orderId\}\}/g, data.orderId || "N/A");

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate the PDF
    const pdfPath = "/tmp/result.pdf"; // Temporary file path for the PDF
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
    });

    page;

    // Close Puppeteer
    await browser.close();

    // Send the PDF file as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="result.pdf"');
    res.status(200).download(pdfPath);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send({ error: "Failed to generate PDF" });
  }
};
