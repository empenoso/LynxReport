/**
 * LynxReport: учёт публикаций 📚 [Node.js Release]
 * 
 * Генерация pdf и html из списка статей в Гугл Таблице [index.js]
 *
 * Запуск под Linux: $ npm start
 * Запуск под Windows: start.bat
 * 
 * Описание: https://habr.com/ru/post/515316/
 *
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 31.08.2024
 * 
 */

const secrets = require('./secrets'); // ключи доступа и идентификаторы
const fs = require("fs")
const puppeteer = require('puppeteer')
const moment = require('moment')
const {
    GoogleSpreadsheet
} = require("google-spreadsheet");

(async () => {
    let startTime = (new Date()).getTime(); //записываем текущее время в формате Unix Time Stamp - Epoch Converter
    console.log("LynxReport: учёт публикаций 📚 [Node.js Release] начала работу в %s. \n", (new Date()).toLocaleString("ru-ru"))

    const doc = new GoogleSpreadsheet('18YPDc6bs17CNwd8NuLpBUn9OZyMigVjYKbCQ1_--Dkw') // https://docs.google.com/spreadsheets/d/18YPDc6bs17CNwd8NuLpBUn9OZyMigVjYKbCQ1_--Dkw/edit#gid=848229268
    doc.useApiKey(secrets.google_spreadsheet_key_read_only); // https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication?id=api-key
    await doc.loadInfo();
    const sheet1 = doc.sheetsByIndex[1] // Данные
    const sheet4 = doc.sheetsByIndex[5] // Ресурсы
    const sheet6 = doc.sheetsByIndex[8] // shardin.name
    const rows1 = await sheet1.getRows()
    const rows4 = await sheet4.getRows()
    const rows6 = await sheet6.getRows()
    await sheet1.loadCells()
    await sheet4.loadCells()
    await sheet6.loadCells()

    console.log(`Генерация Timelines Google Charts для html кода с листа ${sheet4.title}.`)
    Resources = []
    for (var i = 1; i <= rows4.length; i++) {
        if (sheet4.getCell(i, 0).formattedValue != 'Итого:') {
            datefrom = sheet4.getCell(i, 2).formattedValue
            dateto = sheet4.getCell(i, 3).formattedValue
            Resources.push([
                'Публикации',
                `${sheet4.getCell(i, 0).formattedValue}: ${sheet4.getCell(i, 1).value} шт.`,
                `new Date(${datefrom.split("-")[0]}, ${+datefrom.split("-")[1]-1})`,
                `new Date(${dateto.split("-")[0]}, ${+dateto.split("-")[1]})` // -1 если без прибавления одного месяца
            ])
        }
    }
    timelines = `
    dataTable.addColumn({
        type: 'string',
        id: 'Заголовок'
    });
    dataTable.addColumn({
        type: 'string',
        id: 'Название'
    });
    dataTable.addColumn({
        type: 'date',
        id: 'Start'
    });
    dataTable.addColumn({
        type: 'date',
        id: 'End'
    });
    dataTable.addRows([

        // Начало вставки из сгенерированного файла piece_google_charts_timelines
        ${JSON.stringify(Resources)
            .replace(/\"new/gm, 'new')
            .replace(/\)\"/gm, ')')
            .replace(/\,\[/gm, ',\n        [')
            .replace(/\[\[/gm, '[')
            .replace(/\]\]/gm, '],')
        }
        // Выборка сгенерирована ${new Date().toLocaleString("ru-ru")} 
    `
    fs.writeFileSync(`./piece_google_charts_timelines.txt`, timelines)
    console.log(`Генерация Timelines Google Charts для html кода с листа ${sheet4.title} завершена.\n`)


    console.log(`Генерация списка публикаций с листа ${sheet1.title}.\n`)
    Topics = []
    for (var i = 2; i <= rows1.length + 1; i++) {
        // Check if the value is not null, undefined, or empty
        if (sheet1.getCellByA1('F' + i).value) {
            Topics.push(sheet1.getCellByA1('F' + i).value)
        }
    }
    TopicsUnique = Topics.filter((v, i, a) => a.indexOf(v) === i);
    console.log(`Уникальные значения тем: ${JSON.stringify(TopicsUnique)}.\n`)

    var publications = '<!-- Начало вставки из сгенерированного файла piece_publications -->\n<ol>\n'

    // подгружает статистику публикаций
    publications += `<p>Подпишитесь через <a target="_blank" rel="noopener noreferrer" href="https://t.me/mshardin_bot">моего
                        телеграм бота 🤖</a> на уведомления о выходе новых статей. Уведомления без спама.<br><br>
                    Прямо сейчас можно бесплатно скачать любую из опубликованных статей. Для этого нажмите на
                    значок 💾 справа от названия материала. А ещё можно обсудить любую интересную тему в комментариях -
                    просто перейдя по ссылке названия статьи.</p>\n
    <small class="text-muted">${sheet6.getCellByA1('A1').formattedValue}<br>
    <ul>
        <li>${sheet6.getCellByA1('A3').formattedValue}</li>
        <li>${sheet6.getCellByA1('A4').formattedValue}</li>
    </ul>
    </small></p>\n
    <p>Если Вам помогли мои статьи, то можно <a target="_blank" rel="noopener noreferrer" href="https://www.tbank.ru/rm/shardin.mikhail1/0dKi144262/">поддержать автора с помощью доната 💸</a>.</p>`

    // дальше уже разбирам по темам
    for (var t = 0; t <= TopicsUnique.length; t++) {
        publications += `<h5 style="margin-top: 8px;">По теме «${TopicsUnique[t]}»:</h5>\n`
        for (var i = 2; i <= rows1.length + 1; i++) {
            // проверяем что есть ссылка на публикацию и это НЕ перепубликация, а оригинал
            if (sheet1.getCellByA1('D' + i).formattedValue != null && sheet1.getCellByA1('L' + i).formattedValue == null) {
                // console.log(`Строка ${i}: ${sheet1.getCellByA1('A' + i).formattedValue} для ${TopicsUnique[t]}.`)
                var textArray = sheet1.getCellByA1('C' + i).formattedValue.split("-")
                date = textArray[2] + '.' + textArray[1] + '.' + textArray[0] //переделываем дату из 2018-05-17 в 17.05.2018
                var type = sheet1.getCellByA1('B' + i).value

                // Формируем сайты, сгруппированные по темам
                if (TopicsUnique[t] == sheet1.getCellByA1('F' + i).value && type == 'Веб' && sheet1.getCellByA1('D' + i).value != null) {
                    console.log(`[${TopicsUnique[t]}], строка ${i}: ${sheet1.getCellByA1('A' + i).formattedValue}.`)
                    var url = sheet1.getCellByA1('D' + i).value;
                    var path = `./articles/${sheet1.getCellByA1('C' + i).formattedValue}_${url.split(/\/\//)[1].split(/\//)[0].replace(/\./g, '-')}_${sheet1.getCellByA1('F' + i).formattedValue}.pdf`

                    // Инициализируем запись публикации
                    var publicationEntry = `<li>${sheet1.getCellByA1('E' + i).formattedValue}. <a target="_blank" rel="noopener noreferrer" href="${sheet1.getCellByA1('D' + i).formattedValue}">${sheet1.getCellByA1('A' + i).formattedValue}</a> [<a target="_blank" rel="noopener noreferrer" title="Сохраненная копия статьи от ${moment().format('DD.MM.YYYY')}" href="${path}">💾</a>] от ${date}`

                    // Проверка наличия републикации
                    var isRepublication = false;
                    for (var q = 2; q <= rows1.length + 1; q++) {
                        if (sheet1.getCellByA1('L' + q).formattedValue == sheet1.getCellByA1('D' + i).formattedValue) {
                            console.log(`Совпадение: ${sheet1.getCellByA1('L' + q).formattedValue} и ${sheet1.getCellByA1('D' + i).formattedValue}.`);
                            isRepublication = true;
                            break;
                        } else {
                            // console.log(`НЕ совпало: ${sheet1.getCellByA1('L' + q).formattedValue} и ${sheet1.getCellByA1('D' + i).formattedValue}.`);
                        }
                    }

                    // Добавление окончания строки после проверки перепубликации
                    if (isRepublication) {
                        publicationEntry += ` и перепубликации.</li>\n`;
                    } else {
                        publicationEntry += `.</li>\n`;
                    }

                    publications += publicationEntry;
                }

                // Формируем печатные издания
                if (TopicsUnique[t] == sheet1.getCellByA1('F' + i).value && type != 'Веб' && type != 'Видео' && sheet1.getCellByA1('D' + i).value != null) {
                    publications += `<li>${sheet1.getCellByA1('E' + i).formattedValue}. ${sheet1.getCellByA1('A' + i).formattedValue} в ${sheet1.getCellByA1('D' + i).formattedValue.replace(/\[/gm, '').replace(/\]/gm, '')} от ${date}.</li>\n`
                }

                // Формируем видео
                if (TopicsUnique[t] == sheet1.getCellByA1('F' + i).value && type == 'Видео' && sheet1.getCellByA1('D' + i).value != null) {
                    publications += `<li><a target="_blank" rel="noopener noreferrer" href="${sheet1.getCellByA1('D' + i).formattedValue}">${sheet1.getCellByA1('A' + i).formattedValue}</a> от ${date}.</li>\n`
                }
            }
        }
    }
    publications += `<h5 style="margin-top: 8px;">Облако слов из названий:</h5>\n<div id="wordcloud" style="height: 400px;"></div>\n</ol>\n<small>Выборка, PDF копии сайтов и облако слов сгенерированы автоматически ${new Date().toLocaleString("ru-ru")}.</small>\n<!-- Конец вставки из сгенерированного файла -->`
    fs.writeFileSync(`./piece_publications.txt`, publications)
    console.log(`Генерация списка публикаций с листа ${sheet1.title} завершена.\n`)


    console.log(`Генерация облака слов с листа ${sheet1.title}.\n`)
    var vegachart = `// Начало вставки из сгенерированного файла piece_google_charts_vegachart\n`
    for (var i = 2; i <= rows1.length + 1; i++) {
        if (sheet1.getCellByA1('D' + i).formattedValue != null) {
            vegachart += `"${sheet1.getCellByA1('A' + i).formattedValue}",` //${sheet1.getCellByA1('D' + i).formattedValue}
                .replace(/\n/gm, '')
                .replace(/.\sСтр.\s\d+/gm, '') // удаляю записи о страницах
                .replace(/\—/gm, '-')
            vegachart += `\n`
        }
    }
    vegachart += `// Выборка сгенерирована ${new Date().toLocaleString("ru-ru")}`
    fs.writeFileSync(`./piece_google_charts_vegachart.txt`, vegachart)
    console.log(`Генерация облака слов с листа ${sheet1.title} завершена.\n`)



    console.log(`Генерация pdf по ссылкам из таблицы ${doc.title}, лист ${sheet1.title}.`)

    for (var i = 2; i <= rows1.length + 1; i++) { //    
        // Define the URL of the page you want to save as PDF
        type = sheet1.getCellByA1('B' + i).value
        url = sheet1.getCellByA1('D' + i).value

        // Launch a new browser instance
        const browser = await puppeteer.launch({
            headless: true, // Run in headless mode, set to false for debugging
        });

        // Open a new page
        const page = await browser.newPage();

        console.log(`Строка №${i} из ${rows1.length + 1} для ${url}.`)

        if (type == 'Веб' && url != null) {
            path = `./articles/${sheet1.getCellByA1('C' + i).formattedValue}_${url.split(/\/\//)[1].split(/\//)[0].replace(/\./g, '-')}_${sheet1.getCellByA1('F' + i).formattedValue}.pdf`

            // Navigate to the desired URL
            await page.goto(url, {
                waitUntil: 'networkidle2', // Wait until the network is idle
                timeout: 120000,
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
                ${url} | Михаил Шардин, https://shardin.name/ <br />
                Страница <span class="pageNumber"></span> из <span class="totalPages"></span>
            </div>`;

            // Generate the PDF
            await page.pdf({
                path: path, // Output file path
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
            console.log(`Создан файл ${path.split(/\//).pop()}.\n`)
        }
        // Close the browser
        await browser.close();
    }

    console.log(`Генерация pdf по ссылкам из таблицы ${doc.title} завершена.`)

    let currTime = (new Date()).getTime(); //текущее время в формате Unix Time Stamp - Epoch Converter
    let duration = Math.round((currTime - startTime) / 1000 / 60 * 100) / 100; //время выполнения скрипта в минутах
    console.log("\nLynxReport: учёт публикаций 📚 [Node.js Release] закончила работу в %s.", (new Date()).toLocaleString("ru-ru"))
    console.log("Время выполнения LynxReport: учёт публикаций 📚 [Node.js Release] в минутах: %s.", duration)
})();