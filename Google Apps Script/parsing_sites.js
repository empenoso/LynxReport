/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Функции для конкретных сайтов [parsing_sites.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 19.02.2022
 * 
 */

function journal_tinkoff_ru(url) {
    Utilities.sleep(7 * 1000) // 15 sec
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        let Views = +html.match(/,"views":(.*?),"favoritesCount":/)[1] 
        let Comments = +html.match(/"stats":{"comments":(.*?),"/)[1]
        let Bookmarks = +html.match(/,"favoritesCount":(.*?)}/)[1] // +html.match(/<span class="_1T6f2">(.*?)<\/span><\/button>/)[1]
        let Ratings = `?` // +html.match(/<span class="_sRng z2yqt">(.*?)<\/span><button type="button" class="_1bWSy _1eR8l"/)[1];        

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
        Ratings = "+" + stat.likeCount + " / -?" //+ stat.dislikeCount

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

function habr_com(url) {
    // try {
        var html = UrlFetchApp.fetch(url).getContentText();
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
        let Bookmarks = `?` // +html.match(/<span title="Количество пользователей, добавивших публикацию в закладки" class="bookmarks-button__counter">(.*?)<\/span>/)[1]
        let Ratings = +html.match(/class="tm-votes-meter__value tm-votes-meter__value_positive tm-votes-meter__value_appearance-article tm-votes-meter__value_rating">(.*?)<\/span>/)[1]
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

function t_me(url) {
    urlReplace = url
        .replace(/t\.me/g, 'tgstat.ru/channel/@')
        .replace(/\/\@\//g, '/@')
    Logger.log(`Старый адрес: ${url}.\nНовый адрес: ${urlReplace}.`)
    try {
        var html = UrlFetchApp.fetch(urlReplace).getContentText();
        Views = +html.match(/<span class="fa fa-eye"><\/span>&nbsp;(.*?)k            <\/a>/)[1] * 1000
        Comments = '-'
        Bookmarks = '-'
        Ratings = '-'

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
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

function vc_ru(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        Views = +html.match(/<span class="views__value">(.*?)<\/span>/)[1]
        Comments = +html.match(/<span class="comments_counter__count__value">(.*?)<\/span>/)[1]
        Bookmarks = '-'
        Ratings = +html.match(/<span class="vote__value__v vote__value__v--real">(.*?)<\/span>/)[1]

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

function testTiktok() {
    var url = 'https://www.tiktok.com/@di.maiers/video/6938025243042794753';
    var html = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true
    });
    title = html.getContentText().match(/<title>(.*?)<\/title>/)[1]

    Logger.log(`Для ${url}: название = ${title}.`)
    return `${title}`
}

function testHabr() {
    var url = 'https://habr.com/ru/post/645935/';
    VCBR = habr_com(url)
}

function testTinkoff() {
    var url = 'https://journal.tinkoff.ru/sell-apartment-buy-bonds/';
    VCBR = journal_tinkoff_ru(url)
}

