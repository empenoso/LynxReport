const puppeteer = require('puppeteer');

(async () => {
    // Define the URL of the page you want to save as PDF
    const url = 'https://journal.tinkoff.ru/guide/how-to-rent/';

    // Launch a new browser instance
    const browser = await puppeteer.launch({
        headless: true, // Run in headless mode, set to false for debugging
    });

    // Open a new page
    const page = await browser.newPage();

    // Navigate to the desired URL
    await page.goto(url, {
        waitUntil: 'networkidle2', // Wait until the network is idle
    });

    // Define the custom footer HTML
    const footer = `
        <style>
            #header, #footer {
                padding: 0 !important;
            }
            .footer {
                padding: 0 !important;
                margin: 0;
                -webkit-print-color-adjust: exact;
                background-color: blue;
                color: white;
                width: 100%;
                text-align: right;
                font-size: 12px;
            }
        </style>
        <div class="footer">
            ${url} | Mikhail Shardin, https://shardin.name/ <br />
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`;

    // Generate the PDF
    await page.pdf({
        path: 'page.pdf', // Output file path
        format: 'A4', // Paper format
        displayHeaderFooter: true,
        footerTemplate: footer, // Custom footer HTML
        margin: {
            top: '20mm',
            bottom: '20mm',
            right: '10mm',
            left: '10mm',
        },
        printBackground: true, // Include background colors and images
    });

    console.log('PDF saved as page.pdf');

    // Close the browser
    await browser.close();
})();


