/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Функции для конкретных сайтов [parsing_sites.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 18.11.2024
 * 
 */

// Функция для тестирования запроса на Tinkoff Journal
function test_Tinkoff() {
    var url = 'https://journal.tinkoff.ru/rentier/';
    VCBR = journal_tinkoff_ru(url);
}

// Функция для получения статистики статьи из Tinkoff Journal
function journal_tinkoff_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        var searchstring = 'articleUUID":"';
        var index = html.search(searchstring);
        if (index >= 0) {
            var pos = index + searchstring.length;
            var articleUUID = html.substring(pos, pos + 36);
            Logger.log(`articleUUID: https://core.tinkoffjournal.ru/api/public/v2/rpc/articles/get-stats/${articleUUID}`);
        }
        const response = UrlFetchApp.fetch(`https://core.tinkoffjournal.ru/api/public/v2/rpc/articles/get-stats/${articleUUID}`);
        const json = JSON.parse(response.getContentText());
        let Views = json.data.views;
        let Comments = json.data.comments;
        let Bookmarks = json.data.favorites;
        let Ratings = json.data.likes;
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`);
        return `?|?|?|?`;
    }
}

// =================================================================

// Функция для получения статистики видео с YouTube
function youtube_com(url) {
    id = url.match(/v=(.*)\&t/)[1];
    Logger.log(`URL: ${url}.\nid: ${id}.`);
    try {
        let item = YouTube.Videos.list('snippet,statistics', {
            'id': id
        }).items[0];
        let stat = item.statistics;
        Views = stat.viewCount;
        Comments = '-';
        Bookmarks = '-';
        Ratings = "+" + stat.likeCount;

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`);
        return `?|?|?|?`;
    }
}

// =================================================================

// Функция для тестирования запроса на Habr
function test_Habr() {
    var url = 'https://habr.com/ru/articles/857402/';
    VCBR = habr_com(url);
}

// Функция для получения статистики статьи с Habr
function habr_com(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        let Views = +html.match(/<span class=\"tm-icon-counter__value\">(.*?)K<\/span>/)[1]
            .replace(/\,/g, '.') * 1000;
        let Comments = +html.match(/class=\"tm-article-comments-counter-link__value\">(.*?)<\/span>/)[1];

        var searchstringBookmarks = 'bookmarks-button__counter';
        var index = html.search(searchstringBookmarks);
        if (index >= 0) {
            var pos = index + searchstringBookmarks.length;
            var Bookmarks = html.substring(pos, pos + 90);
            Bookmarks = +Bookmarks.match(/\d{1,4}/);
            (!Bookmarks || Bookmarks === undefined) ? Bookmarks = 0: Bookmarks;
        }

        var searchstringRatings = 'Всего голосов';
        var index = html.search(searchstringRatings);
        if (index >= 0) {
            var pos = index + searchstringRatings.length;
            var Ratings = html.substring(pos, pos + 700);
            Ratings = +Ratings.match(/\+\d{1,4}/);
            (!Ratings || Ratings === undefined) ? Ratings = 0: Ratings;
        }

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`);
        return `?|?|?|?`;
    }
}

// =================================================================

// Функция для тестирования запроса на Pikabu
function test_Pikabu() {
    var url = 'https://pikabu.ru/story/kak_ya_pri_pomoshchi_dvukh_skriptov_smog_avtomaticheski_sgenerirovat_opis_dokumentov_dlya_700_stranits_11812093';
    VCBR = pikabu_ru(url);
}

// Функция для получения статистики статьи с Pikabu
function pikabu_ru(url) {
    try {
        // Извлечение идентификатора истории из URL
        const storyId = url.match(/(\d+)$/)[0];
        // Формирование API URL с использованием извлеченного storyId
        const apiUrl = `https://d.pikabu.ru/counters/story/${storyId}`;
        Logger.log(`Служебный API: ${apiUrl}.`);
        // Получение JSON ответа от API
        const response = UrlFetchApp.fetch(apiUrl);
        const json = JSON.parse(response.getContentText());
        var html = UrlFetchApp.fetch(url).getContentText();
        let Views = json.data.v || 0;
        let Comments = (html.match(/<span class="story__comments-link-count">(\d+)<\/span>/) || [0, 0])[1];
        let Bookmarks = "?";
        let Ratings = (html.match(/<div class="story__rating-count">(\d+)<\/div>/) || [0, 0])[1];
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}: ${error}`);
        return `?|?|?|?`;
    }
}

// =================================================================

// Функция для тестирования запроса на Smart Lab
function test_smart_lab_ru() {
    var url = 'https://smart-lab.ru/mobile/topic/1083556/';
    VCBR = smart_lab_ru(url);
}

// Функция для получения статистики с Smart Lab
function smart_lab_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();

        // Извлечение идентификатора темы из URL
        const topicId = url.match(/topic\/(\d+)/)[1];

        // Получение текущего времени в формате Unix (в миллисекундах)
        const timestamp = Date.now();

        // Формирование API URL с topicId и текущим Unix timestamp
        const apiUrl = `https://smart-lab.ru/cgi-bin/gcn.fcgi?list=${topicId}&func=func8422&_=${timestamp}`;
        Logger.log(`Служебный API: ${apiUrl}.`);

        // Установка пользовательского заголовка User-Agent, чтобы запрос выглядел как от Chrome на Windows
        const options = {
            'headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            'muteHttpExceptions': true // Разрешает обработку кодов состояния HTTP, отличных от 200
        };

        // Получение текстового ответа от API с указанными параметрами
        const response = UrlFetchApp.fetch(apiUrl, options).getContentText();
        Logger.log(`Ответ API: ${response}.`);

        // Ответ имеет формат: func8422(1055572,1787);
        // Извлечение просмотров путем разделения строки по символам
        let startIndex = response.indexOf('(') + 1;
        let endIndex = response.indexOf(')');
        let numbers = response.substring(startIndex, endIndex).split(',');

        // Первый номер — это topicId, а второй — это количество просмотров
        let Views = numbers[1] ? parseInt(numbers[1].trim()) : 0;

        var searchstringComments = 'post-card__btn post-card__btn--comment';
        var index = html.search(searchstringComments);
        if (index >= 0) {
            var pos = index + searchstringComments.length;
            var Comments = html.substring(pos + 228, pos + 250);
            // Logger.log(`Comments = ${Comments}`);
            Comments = +Comments.match(/\d{1,4}/);
            (!Comments || Comments === undefined) ? Comments = 0: Comments;
        }

        var searchstringBookmarks = 'post-card__btn post-card__btn--favorite';
        var index = html.search(searchstringBookmarks);
        if (index >= 0) {
            var pos = index + searchstringBookmarks.length;
            var Bookmarks = html.substring(pos + 240, pos + 265);
            // Logger.log(`Bookmarks = ${Bookmarks}`);
            Bookmarks = +Bookmarks.match(/\d{1,4}/);
            (!Bookmarks || Bookmarks === undefined) ? Bookmarks = 0: Bookmarks;
        }
        
        var searchstringRatings = 'post-card__btn post-card__btn--like';
        var index = html.search(searchstringRatings);
        if (index >= 0) {
            var pos = index + searchstringRatings.length;
            var Ratings = html.substring(pos + 228, pos + 250);
            // Logger.log(`Ratings = ${Ratings}`);
            Ratings = +Ratings.match(/\d{1,4}/);
            (!Ratings || Ratings === undefined) ? Ratings = 0: Ratings;
        }

        // Логирование и возврат значений
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}: ${error}`);
        return `?|?|?|?`;
    }
}

// =================================================================

function github_com(url) {
    urlReplace = url + "/stargazers"
    Logger.log(`Старый адрес: ${url}.\nНовый адрес: ${urlReplace}.`)
    try {
        var html = UrlFetchApp.fetch(urlReplace).getContentText();
        Views = '-'
        Comments = '-'
        Bookmarks = +html.match(/All <span title="(.*?)"/)[1]
        Ratings = '-'

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

// =================================================================

function test_Tg() {
    // var url = 'https://t.me/google_sheets/464';
    var url = 'https://t.me/gasru/495';
    VCBR = t_me(url)
}

function t_me(url) {
    try {
        urlReplace = url
            .replace(/t\.me/g, 'tgstat.ru/channel/@')
            .replace(/\/\@\//g, '/@');
        Logger.log(`Старый адрес: ${url}.\nНовый адрес: ${urlReplace}.`);
        var html = UrlFetchApp.fetch(urlReplace).getContentText();
        // Парсинг количества просмотров
        var viewsMatch = html.match(/<i class=\"uil-eye\"><\/i>([0-9,.]+)(k?)/);
        var Views = 0;
        if (viewsMatch) {
            Views = parseFloat(viewsMatch[1].replace(',', '.')) * (viewsMatch[2] === 'k' ? 1000 : 1);
        }
        var commentsMatch = html.match(/<i class="uil-comments-alt"><\/i>(\d+)/);
        var Comments = commentsMatch ? parseInt(commentsMatch[1]) : '-';
        var Bookmarks = '-';
        var ratingsMatch = html.match(/<i class=\"uil-share-alt\"><\/i>([0-9,]+)/);
        var Ratings = ratingsMatch ? parseInt(ratingsMatch[1].replace(',', '')) : 0;
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`);
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`;
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

// =================================================================

function d3today_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        Views = +html.match(/<div class="post_list_item_viewed  icon-glyph-11" title="Просмотров">(.*?)<\/div>/)[1]
        Comments = +html.match(/<a href="#comments">(.*?)<\/a>/)[1]
        Bookmarks = '-'
        Ratings = +html.match(/<div class="blog_post_like_counter rating-vote-result rating-vote-result-plus" >(.*?)<\/div>/)[1]

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

// =================================================================

function test_VC() {
    var url = 'https://vc.ru/office/1478158-kak-ya-pri-pomoshi-dvuh-skriptov-smog-avtomaticheski-sgenerirovat-opis-dokumentov-dlya-700-stranic';
    VCBR = vc_ru(url)
}

function vc_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        Views = +html.match(/class=\"content-views__counter\">(\d+)<\/div>/)[1]
        Comments = +html.match(/class=\"comments-counter__label\">(\d+) <\!/)[1]
        Bookmarks = +html.match(/class=\"bookmark-button__label\">(\d+)</)[1]
        Ratings = '-' //+html.match(/<span class="vote__value__v vote__value__v--real">(.*?)<\/span>/)[1]

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}
