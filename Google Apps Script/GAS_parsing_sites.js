/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Функции для конкретных сайтов [parsing_sites.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 30.08.2024
 * 
 */

function test_Tinkoff() {
    // var url = 'https://journal.tinkoff.ru/sposob-perevozki-velosipedov-na-mashine/';
    // var url = 'https://journal.tinkoff.ru/bond-cash-flow-calc/';
    var url = 'https://journal.tinkoff.ru/rentier/';
    VCBR = journal_tinkoff_ru(url)
}

function journal_tinkoff_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        var searchstring = 'articleUUID":"'
        var index = html.search(searchstring);
        if (index >= 0) {
            var pos = index + searchstring.length
            var articleUUID = html.substring(pos, pos + 36)
            Logger.log(`articleUUID: https://core.tinkoffjournal.ru/api/public/v2/rpc/articles/get-stats/${articleUUID}`)
        }
        const response = UrlFetchApp.fetch(`https://core.tinkoffjournal.ru/api/public/v2/rpc/articles/get-stats/${articleUUID}`)
        const json = JSON.parse(response.getContentText());
        let Views = json.data.views
        let Comments = json.data.comments
        let Bookmarks = json.data.favorites
        let Ratings = json.data.likes
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

// БЫЛО до августа 2024:
// function journal_tinkoff_ru(url) {
//     try {
//         var html = UrlFetchApp.fetch(url).getContentText();
//         var searchstring = 'articleUUID":"'
//         var index = html.search(searchstring);
//         if (index >= 0) {
//             var pos = index + searchstring.length
//             var articleUUID = html.substring(pos, pos + 36)
//             Logger.log(`articleUUID: https://journal.tinkoff.ru/api/public/v1/potoque/?uuid=${articleUUID}`) // https://social.journal.tinkoff.ru/api/v25/profiles/229963/articles/
//         }
//         const response = UrlFetchApp.fetch(`https://journal.tinkoff.ru/api/public/v1/potoque/?uuid=${articleUUID}`)
//         const json = JSON.parse(response.getContentText());
//         let Views = json.data[0].viewsCount
//         let Comments = json.data[0].commentsCount
//         let Bookmarks = json.data[0].favoritesCount
//         let Ratings = json.data[0].likesCount
//         Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
//         return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
//     } catch (error) {
//         Logger.log(`Ошибка чтения данных для ${url}.`)
//         return `?|?|?|?`
//     }
// }

function youtube_com(url) {
    id = url.match(/v=(.*)\&t/)[1]
    Logger.log(`URL: ${url}.\nid: ${id}.`)
    try {
        let item = YouTube.Videos.list('snippet,statistics', {
            'id': id
        }).items[0]
        let stat = item.statistics
        let snippet = item.snippet
        Views = stat.viewCount
        Comments = '-'
        Bookmarks = '-'
        Ratings = "+" + stat.likeCount //+ " / -?" //+ stat.dislikeCount

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

function test_Habr() {
    // var url = 'https://habr.com/ru/articles/825508/';
    var url = 'https://habr.com/ru/companies/habr/articles/814357/';
    VCBR = habr_com(url)
}

function habr_com(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        // Logger.log(`html:\n${html}.`)
        let Views = +html.match(/<span class=\"tm-icon-counter__value\">(.*?)K<\/span>/)[1]
            .replace(/\,/g, '.') * 1000
        let Comments = +html.match(/class=\"tm-article-comments-counter-link__value\">(.*?)<\/span>/)[1] //`?`
        // var searchstringComments = '       Комментарии '
        // var index = html.search(searchstringComments);
        // if (index >= 0) {
        //     var pos = index + searchstringComments.length
        //     var Comments = html.substring(pos, pos + 70)
        //     Comments = +Comments
        //         .split('</span>')[0]
        //         .replace(/<\/sp/g, '');
        //     (!Comments || Comments === undefined) ? Comments = 0: Comments
        // }

        var searchstringBookmarks = 'bookmarks-button__counter'
        var index = html.search(searchstringBookmarks);
        if (index >= 0) {
            var pos = index + searchstringBookmarks.length
            var Bookmarks = html.substring(pos, pos + 90)
            Bookmarks = +Bookmarks.match(/\d{1,4}/);
            (!Bookmarks || Bookmarks === undefined) ? Bookmarks = 0: Bookmarks
        }

        // let Ratings = +html.match(/\">(\+?\d+)<\/span><\/div><\/div><\!\-\-teleport start\-\-><\!\-\-teleport end\-\-\>/)[1]
        var searchstringRatings = 'Всего голосов'
        var index = html.search(searchstringRatings);
        if (index >= 0) {
            var pos = index + searchstringRatings.length
            var Ratings = html.substring(pos, pos + 700)
            // Logger.log(`Ratings:\n${Ratings}.`)
            Ratings = +Ratings.match(/\+\d{1,4}/);
            (!Ratings || Ratings === undefined) ? Ratings = 0: Ratings
        }

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

function test_Pikabu() {
    var url = 'https://pikabu.ru/story/kak_ya_nashyol_prevoskhodnyiy_no_dorogoy_sposob_perevozki_velosipedov_v_avtomobile_11759297';
    VCBR = pikabu_ru(url)
}

function pikabu_ru(url) {
    try {
        // Extract the number from the original link
        const storyId = url.match(/(\d+)$/)[0];

        // Construct the API URL using the extracted storyId
        const apiUrl = `https://d.pikabu.ru/counters/story/${storyId}`;

        // Fetch the JSON response from the API
        const response = UrlFetchApp.fetch(apiUrl);
        const json = JSON.parse(response.getContentText());

        let Views = json.data.v
        let Comments = 0
        let Bookmarks = 0
        let Ratings = 0
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

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

function test_TG() {
    var url = 'https://t.me/google_sheets/464';
    VCBR = t_me(url)
}

function t_me(url) {
    // try {
    urlReplace = url
        .replace(/t\.me/g, 'tgstat.ru/channel/@')
        .replace(/\/\@\//g, '/@')
    Logger.log(`Старый адрес: ${url}.\nНовый адрес: ${urlReplace}.`)

    var html = UrlFetchApp.fetch(urlReplace).getContentText();
    Views = +html.match(/<i class=\"uil-eye\"><\/i>(.*?)k/)[1] * 1000
    Comments = '-' // +html.match(/<i class=\"uil-comments-alt\"><\/i>(.*?)                    <\/span>/)[1]
    Bookmarks = '-'
    Ratings = +html.match(/<i class=\"uil-share-alt\"><\/i>(.*?)                <\/a>/)[1]

    Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
    return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    // } catch (error) {
    //     Logger.log(`Ошибка чтения данных для ${url}.`)
    //     return `?|?|?|?`
    // }
}

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

function test_VC() {
    var url = 'https://vc.ru/finance/92990-upravlencheskiy-uchet-lichnyh-aktivov';
    VCBR = vc_ru(url)
}

function vc_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        Views = +html.match(/<span class=\"views__value\">(.*?)<\/span>/)[1]
        Comments = '-' // +html.match(/<span class="comments_counter__count__value">(.*?)<\/span>/)[1]
        Bookmarks = '-'
        Ratings = '-' //+html.match(/<span class="vote__value__v vote__value__v--real">(.*?)<\/span>/)[1]

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}