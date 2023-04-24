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
 * Last updated: 24.04.2023
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
    const sheet1 = doc.sheetsByIndex[1]
    const sheet4 = doc.sheetsByIndex[4]
    const sheet6 = doc.sheetsByIndex[6]
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
                `new Date(${datefrom.split("-")[0]}, ${datefrom.split("-")[1]-1})`,
                `new Date(${dateto.split("-")[0]}, ${dateto.split("-")[1]})` // -1 если без прибавления одного месяца
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
        Topics.push(sheet1.getCellByA1('F' + i).value)
    }
    TopicsUnique = Topics.filter((v, i, a) => a.indexOf(v) === i);
    console.log(`Уникальные значения тем: ${JSON.stringify(TopicsUnique)}.\n`)

    var publications = '<!-- Начало вставки из сгенерированного файла piece_publications -->\n<ol>\n'

    // подгружает статистику публикаций
    publications += `Ниже Вы можете бесплатно скачать любую из моих опубликованных статей. Для этого нажмите на значок 💾
    справа от названия материала. Также Вы можете принять участие в обсуждении интересных Вам тем, просто
    перейдя по ссылке - комментарии есть у всех статей.<br>\n
    <small class="text-muted">${sheet6.getCellByA1('A1').formattedValue}<br>
    <ul>
        <li>${sheet6.getCellByA1('A3').formattedValue}</li>
        <li>${sheet6.getCellByA1('A4').formattedValue}</li>
    </ul>
    </small>\n`

    // дальше уже разбирает по темам
    for (var t = 0; t <= TopicsUnique.length; t++) {
        publications += `<h5 style="margin-top: 8px;">По теме «${TopicsUnique[t]}»:</h5>\n`
        for (var i = 2; i <= rows1.length + 1; i++) {
            if (sheet1.getCellByA1('D' + i).formattedValue != null) {
                console.log(`Строка ${i}: ${sheet1.getCellByA1('A' + i).formattedValue} для ${TopicsUnique[t]}.`)
                var textArray = sheet1.getCellByA1('C' + i).formattedValue.split("-")
                date = textArray[2] + '.' + textArray[1] + '.' + textArray[0] //переделываем дату из 2018-05-17 в 17.05.2018
                var type = sheet1.getCellByA1('B' + i).value
                if (TopicsUnique[t] == sheet1.getCellByA1('F' + i).value && type == 'Веб' && sheet1.getCellByA1('D' + i).value != null) {
                    var url = sheet1.getCellByA1('D' + i).value
                    var path = `./articles/${sheet1.getCellByA1('C' + i).formattedValue}_${url.split(/\/\//)[1].split(/\//)[0].replace(/\./g, '-')}_${sheet1.getCellByA1('F' + i).formattedValue}.pdf`
                    publications += `<li>${sheet1.getCellByA1('E' + i).formattedValue}. <a target="_blank" rel="noopener noreferrer" href="${sheet1.getCellByA1('D' + i).formattedValue}">${sheet1.getCellByA1('A' + i).formattedValue}</a> [<a target="_blank" rel="noopener noreferrer" title="Сохраненная копия статьи от ${moment().format('DD.MM.YYYY')}" href="${path}">💾</a>] от ${date}.</li>\n`
                }

                if (TopicsUnique[t] == sheet1.getCellByA1('F' + i).value && type != 'Веб' && type != 'Видео' && sheet1.getCellByA1('D' + i).value != null) {
                    publications += `<li>${sheet1.getCellByA1('E' + i).formattedValue}. ${sheet1.getCellByA1('A' + i).formattedValue} в ${sheet1.getCellByA1('D' + i).formattedValue.replace(/\[/gm, '').replace(/\]/gm, '')} от ${date}.</li>\n`
                }

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
    const browser = await puppeteer.launch();
    // const browser = await puppeteer.launch({
    //     ignoreHTTPSErrors: true,
    //     acceptInsecureCerts: true,
    //     args: ['--proxy-bypass-list=*', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-first-run', '--no-sandbox', '--no-zygote', '--single-process', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list', '--enable-features=NetworkService']
    // });

    for (var i = 2; i <= rows1.length + 1; i++) { //                
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36');
        await page.setDefaultNavigationTimeout(0);

        type = sheet1.getCellByA1('B' + i).value
        url = sheet1.getCellByA1('D' + i).value
        const footer = `<style>#header, #footer { padding: 0 !important; }</style><div class="footer" style="padding: 0 !important; margin: 0; -webkit-print-color-adjust: exact; background-color: blue; color: white; width: 100%; text-align: right; font-size: 12px;">${url} | Михаил Шардин, https://shardin.name/ <br /> Страница <span class="pageNumber"></span> из <span class="totalPages"></span> </div>`;
        console.log(`Строка №${i} из ${rows1.length + 1} для ${url}.`)

        if (type == 'Веб' && url != null) {
            path = `./articles/${sheet1.getCellByA1('C' + i).formattedValue}_${url.split(/\/\//)[1].split(/\//)[0].replace(/\./g, '-')}_${sheet1.getCellByA1('F' + i).formattedValue}.pdf`

            await page.goto(url, {
                waitUntil: 'networkidle0'
            });
            await page.waitFor(20 * 1000)
            await page.emulateMediaType('screen');
            const pdf = await page.pdf({
                path: path,
                margin: {
                    top: 40,
                    bottom: 40,
                    left: 20,
                    right: 10
                },
                printBackground: true,
                displayHeaderFooter: true,
                footerTemplate: footer,
                format: 'A4',
            });
            console.log(`Создан файл ${path.split(/\//).pop()}.\n`)
            await page.close()
        }
    }

    await browser.close();
    console.log(`Генерация pdf по ссылкам из таблицы ${doc.title} завершена.`)

    let currTime = (new Date()).getTime(); //текущее время в формате Unix Time Stamp - Epoch Converter
    let duration = Math.round((currTime - startTime) / 1000 / 60 * 100) / 100; //время выполнения скрипта в минутах
    console.log("\nLynxReport: учёт публикаций 📚 [Node.js Release] закончила работу в %s.", (new Date()).toLocaleString("ru-ru"))
    console.log("Время выполнения LynxReport: учёт публикаций 📚 [Node.js Release] в минутах: %s.", duration)
})();
