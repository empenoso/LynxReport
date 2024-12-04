const puppeteer = require('puppeteer');

async function fetchStockData() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Заголовки для эмуляции запроса, как если бы это был обычный браузер
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        // Модифицируем запросы, если они требуют особых заголовков
        if (request.url().includes('api.investing.com')) {
            request.continue({
                headers: {
                    ...request.headers(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                }
            });
        } else {
            request.continue();
        }
    });

    // Запрос к API с правильными заголовками
    const response = await page.goto('https://api.investing.com/api/financialdata/23684/historical/chart/?interval=PT1M&pointscount=60');

    // Чтение ответа
    const data = await response.json();

    await browser.close();

    // Обработка данных
    if (data.data) {
        console.log('Timestamp | Open | High | Low | Close');
        data.data.forEach(item => {
            const timestamp = new Date(item[0]);
            const [open, high, low, close] = item.slice(1, 5);
            console.log(`${timestamp.toISOString()} | ${open} | ${high} | ${low} | ${close}`);
        });
    } else {
        console.log('Ошибка при получении данных:', data);
    }
}

fetchStockData();
