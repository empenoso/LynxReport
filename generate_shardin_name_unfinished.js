/**
 * LynxReport: учёт публикаций 📚 [Node.js Release]
 * 
 * Генерация pdf и html из списка статей в Гугл Таблице через официальную 
 * клиентскую библиотека Node.js от Google для доступа к API Google Sheets 
 *
 * Запуск под Linux: $ npm start
 * Запуск под Windows: start.bat
 * 
 * Описание: https://habr.com/ru/post/515316/
 *
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 03.12.2024
 * 
 */

const {
    google
} = require('googleapis');
const secrets = require('./secrets/secret'); // ключи доступа и идентификаторы
const fs = require('fs');
const puppeteer = require('puppeteer');
const moment = require('moment');

const SHEET_ID = '18YPDc6bs17CNwd8NuLpBUn9OZyMigVjYKbCQ1_--Dkw'; // Your spreadsheet ID
const RANGE_SHEET1 = 'Данные';
const RANGE_SHEET4 = 'Ресурсы';

async function authorize() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './secrets/credentials.json', // Path to your service account key
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return auth.getClient();
}

// Считывание листа
async function getSheetData(auth, sheetId, range) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
    });
    return response.data.values;
}

// Считывание ячеек
async function getSheetCell(auth, sheetId, ranges) {
    const sheets = google.sheets({
        version: 'v4',
        auth
    });
    const response = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: sheetId,
        ranges, // Pass the array of ranges here
    });
    return response.data;
}

(async () => {
    const authClient = await authorize();

    console.log("LynxReport: учёт публикаций 📚 [Node.js Release] начала работу в %s. \n", (new Date()).toLocaleString("ru-ru"));

    // Извлечение данных из Google Таблиц
    const sheet1Data = await getSheetData(authClient, SHEET_ID, RANGE_SHEET1);
    const sheet4Data = await getSheetData(authClient, SHEET_ID, RANGE_SHEET4);

    console.log(`Генерация Timelines Google Charts для данных с листа ${RANGE_SHEET4}.`);
    const resources = sheet4Data.slice(1).map(row => {
        const [title, count, dateFrom, dateTo] = row;
        if (title && title !== 'Итого:') {
            const [yearFrom, monthFrom] = dateFrom.split('-').map(Number);
            const [yearTo, monthTo] = dateTo.split('-').map(Number);
            return [
                'Публикации',
                `${title}: ${count} шт.`,
                `new Date(${yearFrom}, ${monthFrom - 1})`,
                `new Date(${yearTo}, ${monthTo})`,
            ];
        }
        return null;
    }).filter(Boolean);

    const timelines = `
        dataTable.addColumn({ type: 'string', id: 'Заголовок' });
        dataTable.addColumn({ type: 'string', id: 'Название' });
        dataTable.addColumn({ type: 'date', id: 'Start' });
        dataTable.addColumn({ type: 'date', id: 'End' });
        dataTable.addRows([
        // Начало вставки из сгенерированного файла generate_google_charts_timelines        
        ${JSON.stringify(resources)
                .replace(/\"new/gm, 'new')
                .replace(/\)\"/gm, ')')
                .replace(/\,\[/gm, ',\n        [')
                .replace(/\[\[/gm, '[')
                .replace(/\]\]/gm, '],')
        }
        // Выборка сгенерирована ${new Date().toLocaleString("ru-ru")} 
        ]);
    `;
    fs.writeFileSync('./generate_google_charts_timelines.txt', timelines);
    console.log(`Генерация Timelines Google Charts для html кода с листа ${RANGE_SHEET4} завершена.\n`);

    // =============================================================

    console.log(`Генерация списка публикаций с листа ${RANGE_SHEET1}.\n`);
    const topics = sheet1Data.slice(1).map(row => row[5]).filter(Boolean);
    const uniqueTopics = [...new Set(topics)];
    console.log(`Уникальные значения тем: ${JSON.stringify(uniqueTopics)}.\n`)

    let publications = '<!-- Начало вставки из сгенерированного файла generate_publications -->\n<ol>\n';

    // подгружает статистику публикаций
    const rangesPublicationStatistics = ['shardin.name!A1', 'shardin.name!A3', 'shardin.name!A4'];
    const sheet6Data = await getSheetCell(authClient, SHEET_ID, rangesPublicationStatistics);
    const PublicationStatistics = sheet6Data.valueRanges.map(range => range.values ?.[0]?.[0] || null);
    console.log(`Подгружает статистику публикаций:\n${JSON.stringify(PublicationStatistics, null, 2)} `);

    publications += `<p>Подпишитесь через <a target="_blank" rel="noopener noreferrer" href="https://t.me/mshardin_bot">моего
      телеграм бота 🤖</a> на уведомления о выходе новых статей. Уведомления без спама.<br><br>
      Прямо сейчас можно бесплатно скачать любую из опубликованных статей. Для этого нажмите на
      значок 💾 справа от названия материала. А ещё можно обсудить любую интересную тему в комментариях -
      просто перейдя по ссылке названия статьи.</p>\n
      <small class="text-muted">${PublicationStatistics[0]}<br>
      <ul>
        <li>${PublicationStatistics[1]}</li>
        <li>${PublicationStatistics[2]}</li>
      </ul>
      </small></p>\n
      <p>Если Вам помогли мои статьи, то можно <a target="_blank" rel="noopener noreferrer" href="https://www.tbank.ru/rm/shardin.mikhail1/0dKi144262/">поддержать автора с помощью доната 💸</a>.</p>`

    // дальше уже разбирам по темам
    uniqueTopics.forEach(topic => {
        publications += `<h5 style="margin-top: 8px;">По теме «${topic}»:</h5>\n`;
        sheet1Data.slice(1).forEach(row => {
            const [title, type, dateStr, url, description, topicName] = row;
            if (topicName === topic && url) {
                const date = moment(dateStr, 'YYYY-MM-DD').format('DD.MM.YYYY');
                publications += `<li>${description}. <a target="_blank" rel="noopener noreferrer" href="${url}">${title}</a> от ${date}.</li>\n`;
            }
        });
    });
    publications += '</ol>\n<!-- Конец вставки из сгенерированного файла -->';
    fs.writeFileSync('./generate_publications.txt', publications);
    console.log(`Генерация списка публикаций с листа ${RANGE_SHEET1} завершена.\n`);

    // =============================================================

    console.log(`Генерация pdf по ссылкам из таблицы.`);
    const browser = await puppeteer.launch({
        headless: true
    });
    for (const row of sheet1Data.slice(1)) {
        const [title, type, dateStr, url] = row;
        if (type === 'Веб' && url) {
            const page = await browser.newPage();
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 120000
            });
            const path = `./articles/${dateStr}_${url.replace(/https?:\/\//, '').split('/')[0].replace(/\./g, '-')}.pdf`;
            await page.pdf({
                path,
                format: 'A4'
            });
            await page.close();
        }
    }
    await browser.close();
    console.log(`Генерация pdf завершена.\n`);
})();