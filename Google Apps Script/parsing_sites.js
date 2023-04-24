/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Функции для конкретных сайтов [parsing_sites.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 21.04.2023
 * 
 */

function testTinkoff() {
    var url = 'https://journal.tinkoff.ru/list/i-am-smart/';
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
            Logger.log(`articleUUID: https://journal.tinkoff.ru/api/public/v1/potoque/?uuid=${articleUUID}`) // https://social.journal.tinkoff.ru/api/v25/profiles/229963/articles/
        }
        const response = UrlFetchApp.fetch(`https://journal.tinkoff.ru/api/public/v1/potoque/?uuid=${articleUUID}`)
        const json = JSON.parse(response.getContentText());
        let Views = json.data[0].viewsCount
        let Comments = json.data[0].commentsCount
        let Bookmarks = json.data[0].favoritesCount
        let Ratings = json.data[0].likesCount
        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

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

function testHabr() {
    var url = 'https://habr.com/post/481566/';
    VCBR = habr_com(url)
}

function habr_com(url) {
    // try {
    var html = UrlFetchApp.fetch(url).getContentText();
    // Logger.log(`html:\n${html}.`)
    let Views = +html.match(/<span class="tm-icon-counter__value">(.*?)K<\/span>/)[1]
        .replace(/\,/g, '.') * 1000
    // let Comments = `?`// +html.match(/class="tm-comments__comments-count">(.*?)<\/span>/)[1]
    var searchstringComments = '       Комментарии '
    var index = html.search(searchstringComments);
    if (index >= 0) {
        var pos = index + searchstringComments.length
        var Comments = html.substring(pos, pos + 70)
        Comments = +Comments
            .split('</span>')[0]
            .replace(/<\/sp/g, '');
        (!Comments || Comments === undefined) ? Comments = 0: Comments
    }

    var searchstringBookmarks = 'bookmarks-button__counter'
    var index = html.search(searchstringBookmarks);
    if (index >= 0) {
        var pos = index + searchstringBookmarks.length
        var Bookmarks = html.substring(pos, pos + 20)
        Bookmarks = +Bookmarks.match(/\d{1,4}/);
        (!Bookmarks || Bookmarks === undefined) ? Bookmarks = 0: Bookmarks
    }
    let Ratings = +html.match(/tm-votes-meter__value_appearance-article tm-votes-meter__value_rating\">(.*?)<\/span>/)[1]
    Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
    return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    // } catch (error) {
    //     Logger.log(`Ошибка чтения данных для ${url}.`)
    //     return `?|?|?|?`
    // }
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

function testTG() {
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

function testVC() {
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
