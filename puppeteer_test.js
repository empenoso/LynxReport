const puppeteer = require('puppeteer');

(async () => {

    // Create a browser instance
    const browser = await puppeteer.launch({
        headless: false, //"new" //false - для теста
        ignoreHTTPSErrors: true,
        acceptInsecureCerts: true,
        args: ['--proxy-bypass-list=*', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-first-run', '--no-sandbox', '--no-zygote', '--single-process', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list', '--enable-features=NetworkService']
    });

    // Create a new page
    const page = await browser.newPage();

    // Website URL to export as pdf
    // const website_url = 'https://habr.com/ru/articles/773620/';
    const website_url = 'https://journal.tinkoff.ru/guide/how-to-rent/'; 
    // const website_url = 'https://www.bannerbear.com/blog/how-to-download-images-from-a-website-using-puppeteer/'; 
    


    // Open URL in current page
    // await page.goto(website_url, {
    //     waitUntil: 'networkidle0'
    // });    
    await page.goto(website_url, {
        waitUntil: 'load',
        // Remove the timeout
        timeout: 0
    });    

    //To reflect CSS used for screens instead of print    
    await page.emulateMediaType('screen');

    // Downlaod the PDF
    const pdf = await page.pdf({
        path: 'result.pdf',
        margin: {
            top: '100px',
            right: '50px',
            bottom: '100px',
            left: '50px'
        },
        printBackground: true,
        format: 'A4',
    });

    // Close the browser instance
    await browser.close();
})();

