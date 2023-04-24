/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Основной файл [index.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 21.04.2023
 * 
 */

function UpdatingArticleViewsCommentsBookmarksRatings() {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Данные");

    var RowFirst = 2 //начальная строка выполнения скрипта 
    var RowLast =  sheet.getLastRow() - 2; //конечная строка выполнения скрипта
    var data = sheet.getRange("a" + RowFirst + ":aa" + RowLast).getValues()

    var startTime = (new Date()).getTime(); //записываем текущее время в формате Unix Time Stamp - Epoch Converter
    var ViewsCommentsBookmarksRatings = []

    for (x = RowFirst; x < (data.length + RowFirst); x++) {   // для основного запуска
        if (data[x - RowFirst][1] == "Веб" || data[x - RowFirst][1] == "Видео") {
            var url = data[x - RowFirst][3];
            var domainName = url.match(/^(?:\/\/|[^\/]+)*/);
            Logger.log(`Сайт ${domainName} в строке ${x} из ${data.length + RowFirst - 1}. Полный адрес: ${url}`);

            if (domainName == 'https://journal.tinkoff.ru') {
                VCBR = journal_tinkoff_ru(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else if (domainName == 'https://www.youtube.com') {
                VCBR = youtube_com(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else if (domainName == 'https://habr.com') {
                VCBR = habr_com(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else if (domainName == 'https://github.com') {
                VCBR = github_com(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else             if (domainName == 'https://t.me') {
                VCBR = t_me(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            }             else if (domainName == 'https://3dtoday.ru') {
                VCBR = d3today_ru(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else if (domainName == 'https://vc.ru') {
                VCBR = vc_ru(url)
                ViewsCommentsBookmarksRatings.push([
                    VCBR.split('|')[0],
                    VCBR.split('|')[1],
                    VCBR.split('|')[2],
                    VCBR.split('|')[3]
                ])
            } else { // если какие-то другие сайты на которых нет открытых данных о просмотрах
                ViewsCommentsBookmarksRatings.push([
                    'нд',
                    '-',
                    '-',
                    '-'
                ])
            }
        } else { // если печатные издания, где нет просмотров
            ViewsCommentsBookmarksRatings.push([
                '-',
                '-',
                '-',
                '-'
            ])
        }
        // console.log(`Cтрока № ${x}: ${JSON.stringify(ViewsCommentsBookmarksRatings[ViewsCommentsBookmarksRatings.length - 1])}.`)
    }
    sheet.getRange("H" + RowFirst + ":K" + (RowFirst + ViewsCommentsBookmarksRatings.length - 1)).setValues(ViewsCommentsBookmarksRatings);

    var currTime = (new Date()).getTime(); //текущее время в формате Unix Time Stamp - Epoch Converter
    var durationNew = Math.round((currTime - startTime) / 1000 / 60 * 100) / 100; //время выполнения скрипта в минутах
    sheet.getRange(sheet.getLastRow() + 0, 1).setValue(`Скрипт обновлен ${Utilities.formatDate(new Date(), "GMT+5", "dd.MM.yyyy в HH:mm:ss")} за ${durationNew} минуту.`);

    Logger.log(`Время сервера ${(new Date()).toLocaleString("ru-ru")}.\nДлительность работы: ${durationNew}.`);
}

function DataCleansing() {
    var startTime = (new Date()).getTime(); //записываем текущее время в формате Unix Time Stamp - Epoch Converter

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName("Данные");

    var RowFirst = 2 //начальная строка выполнения скрипта 
    var RowLast = sheet.getLastRow() - 2; //конечная строка выполнения скрипта
    var data = sheet.getRange("a" + RowFirst + ":aa" + RowLast).getValues()

    var clearContent = []
    for (x = RowFirst; x < (data.length + RowFirst); x++) {
        clearContent.push([
            "пусто",
            "пусто",
            "пусто",
            "пусто"
        ])
    }
    sheet.getRange("H" + RowFirst + ":K" + (RowFirst + clearContent.length - 1)).setValues(clearContent);

    var currTime = (new Date()).getTime(); //текущее время в формате Unix Time Stamp - Epoch Converter
    var durationNew = Math.round((currTime - startTime) / 1000 / 60 * 100) / 100; //время выполнения скрипта в минутах
    sheet.getRange(sheet.getLastRow() + 0, 1).setValue(`Данные очищены ${Utilities.formatDate(new Date(), "GMT+5", "dd.MM.yyyy в HH:mm:ss")} за ${durationNew} секунд.`);
}
