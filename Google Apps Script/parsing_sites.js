/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Функции для конкретных сайтов [parsing_sites.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 04.02.2021
 * 
 */

function journal_tinkoff_ru(url) {
    Utilities.sleep(10 * 1000) // 15 sec
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        let Views = +html.match(/svg>(.*?)K<\/div><a href="#comments"/)[1] * 1000
        let Comments = +html.match(/class="_2lm8E">(.*?)<\/span><\/div><\/a><div class="_3teJk _3Qz4J">/)[1]
        let Bookmarks = +html.match(/<span class="_1T6f2">(.*?)<\/span><\/button>/)[1]
        let Ratings = +html.match(/<span class="_2vtFp" style="color:#000">(.*?)<\/span><button class="_9GPyX _2ag8l"/)[1];
        (!Ratings || Ratings === undefined) ? Ratings = 0: Ratings

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
        Ratings = "+" + stat.likeCount + " / -" + stat.dislikeCount

        Logger.log(`Для ${url}:\nПросмотры = ${Views} \nКомментарии = ${Comments} \nЗакладки = ${Bookmarks} \nРейтинг = ${Ratings}.`)
        return `${Views}|${Comments}|${Bookmarks}|${Ratings}`
    } catch (error) {
        Logger.log(`Ошибка чтения данных для ${url}.`)
        return `?|?|?|?`
    }
}

function habr_com(url) {
    try {
        var html = UrlFetchApp.fetch(url).getContentText();
        let Views = +html.match(/<span class="post-stats__views-count">(.*?)k<\/span>/)[1]
            .replace(/\,/g, '.') * 1000
        let Comments = +html.match(/title="Читать комментарии">(.*?)<\/span>/)[1]
        let Bookmarks = +html.match(/title="Количество пользователей, добавивших публикацию в закладки">(.*?)<\/span>/)[1]
        var searchstringRatings = 'onclick="posts_vote_result'
        var index = html.search(searchstringRatings);
        if (index >= 0) {
            var pos = index + searchstringRatings.length
            var Ratings = html.substring(pos, pos + 70)
            Ratings = Ratings
                .split('</span>')[0]
                .split('">')[1]
                .replace(/<\/sp/g, '');
            (!Ratings || Ratings === undefined) ? Ratings = 0: Ratings
        }
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