/**
 * LynxReport: учёт публикаций 📚 [Node.js Release]
 * 
 * Парсинг Хабра для составления статьи какие темы интересны читателям
 * 
 * Описание: https://habr.com/ru/articles/867068/
 *
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 16.12.2024
 * 
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const {
    parse
} = require('json2csv');

// Функция для извлечения JSON с сайта
async function extractArticlesList(url) {
    try {
        // Загружаем HTML страницы
        const {
            data: html
        } = await axios.get(url);

        // Загружаем HTML в Cheerio для парсинга
        const $ = cheerio.load(html);

        // Ищем скрипт, содержащий `window.__INITIAL_STATE__`
        const scriptContent = $('script')
            .toArray()
            .map(script => $(script).html())
            .find(content => content && content.includes('window.__INITIAL_STATE__'));

        if (!scriptContent) {
            throw new Error('Не удалось найти __INITIAL_STATE__ в HTML');
        }

        // Извлекаем JSON из содержимого скрипта
        const jsonMatch = scriptContent.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*\});/s);
        if (!jsonMatch || jsonMatch.length < 2) {
            throw new Error('Не удалось извлечь JSON из __INITIAL_STATE__');
        }

        // Парсим JSON и возвращаем `articlesList`
        const initialState = JSON.parse(jsonMatch[1]);
        const initialJSON = initialState.articlesList.articlesList;
        // console.log(`JSON в HTML для ${url}: ${JSON.stringify(initialJSON, null, 2)}`);  

        return initialJSON;
    } catch (error) {
        // console.error(`❌ Ошибка при извлечения JSON из URL: ${url}:`, error.message);
        return null;
    }
}


// Функция для получения данных статьи
async function fetchArticleData(url, articlesList) {
    try {
        // Извлекаем ID публикации из URL
        const articleIdMatch = url.match(/\/(\d+)\/?$/); // Исправлено регулярное выражение
        if (!articleIdMatch) {
            throw new Error(`Не удалось извлечь ID статьи из URL: ${url}`);
        }
        const articleId = articleIdMatch[1];

        // console.log(`Ищем статью с ID: ${articleId} в articlesList`);
        // console.log(`Ключи в articlesList: ${Object.keys(articlesList[articleId]).join(', ')}`);

        // Ищем данные статьи по ID
        const article = articlesList[articleId];
        // console.log(`JSON для ${url}: ${JSON.stringify(article, null, 2)}`);
        if (!article) {
            throw new Error(`Статья с ID ${articleId} не найдена.`);
        }

        return {
            id: article.id,
            timePublished: article.timePublished,
            author: `${article.author.fullname}, @${article.author.alias}, карма ${article.author.scoreStats.score}`,
            isCorporative: article.isCorporative,
            title: article.titleHtml,
            hubs: article.hubs.map(hub => hub.title).join(', '),
            flows: article.flows.map(flow => flow.title).join(', '),
            shortDescription: article.leadData.textHtml,
            views: article.statistics.readingCount,
            comments: article.statistics.commentsCount,
            bookmarks: article.statistics.favoritesCount,
            rating: article.statistics.score,
            votesPlus: article.statistics.votesCountPlus,
            votesMinus: article.statistics.votesCountMinus
        };
    } catch (error) {
        console.error(`Ошибка при обработке статьи ${url}:`, error.message);
        return null;
    }
    return null;
}


// Функция для записи данных в CSV
async function writeToCsv(data, outputPath) {
    try {
        const csv = parse(data, {
            fields: Object.keys(data[0]),
            delimiter: ';' // Установите разделитель на точку с запятой
        });
        fs.writeFileSync(outputPath, csv, 'utf-8');
        console.log(`Данные успешно сохранены в файл: ${outputPath}`);
    } catch (error) {
        console.error('Ошибка при записи CSV:', error.message);
    }
}

(async () => {
    // Базовый URL и начальный ID
    const baseUrl = 'https://habr.com/ru/articles/';
    let currentId = 866732; // Начальный ID
    const articles = []; // Массив для хранения данных статей
    let i = 0; // Счетчик статей
    let successCount = 0; // Счетчик подходящих под условия и успешно обработаных
    let processedCount = 0; // Счетчик обработаных
    let errorCount = 0; // Счетчик ошибок

    while (true) {
        const url = `${baseUrl}${currentId}/`; // Формируем URL для текущей статьи                
        console.log(`Обрабатываем ${i + 1}: ${url}`);

        try {
            // Получаем articlesList - это JSON со всеми важными данными с сайта
            const articlesList = await extractArticlesList(url);

            if (!articlesList) {
                console.log(`❌ Не удалось получить JSON со всеми важными данными для ${url}`);
                i++;
                currentId--; // Переходим к следующей статье
                errorCount++;
                continue;
            }

            // Извлекаем данные статьи
            const articleData = await fetchArticleData(url, articlesList);
            if (!articleData) {
                console.log(`❌ Ошибка извлечения данных для ${url}`);
                i++;
                currentId--;
                errorCount++;
                continue;
            }

            // Проверяем дату публикации
            const timePublished = new Date(articleData.timePublished); // Преобразуем строку в объект Date
            const stopDate = new Date('2024-12-15'); // Условие завершения
            if (timePublished < stopDate) {
                console.log(`\n🛑 Достигнута дата завершения: ${timePublished.toISOString()}`);
                break; // Останавливаем цикл
            }

            // Условие: рейтинг больше 30 или просмотры больше 30 000
            if (articleData.rating > 30 || articleData.views > 30000) {                
                successCount++;
                articles.push(articleData);
                console.log(`✔️ Статья от ${timePublished.toISOString()} "${articleData.title}", id: ${currentId} удовлетворяет условиям (рейтинг: ${articleData.rating}, просмотры: ${articleData.views}).`);
            } else {
                processedCount++;
                console.log(`✖️ Статья от ${timePublished.toISOString()} "${articleData.title}", id: ${currentId} не удовлетворяет условиям (рейтинг: ${articleData.rating}, просмотры: ${articleData.views}).`);
            }

            // Сохраняем данные каждые 5 итераций
            if (articles.length > 0) {
                if (articles.length % 10 === 0) {
                    const outputPath = path.join(__dirname, 'articles.csv');
                    console.log(`💾 Сохраняем данные в файл: ${outputPath}`);
                    await writeToCsv(articles, outputPath);
                }
            }

        } catch (error) {
            console.error(`❌ Ошибка обработки ${url}: ${error.message}`);
        }

        i++;
        currentId--; // Уменьшаем ID для перехода к следующей статье
    }

    // Финальное сохранение
    if (articles.length > 0) {
        const outputPath = path.join(__dirname, 'articles.csv');
        console.log(`💾 Финальное сохранение данных в файл: ${outputPath}`);
        await writeToCsv(articles, outputPath);
    }

    // Финальные счетчики
    console.log('\n--- Вся обработка завершена ---');
    console.log(`Подходят под условия и успешно обработаны: ${successCount}`);
    console.log(`Были данные, но под условия не подходят: ${processedCount}`);
    console.log(`Обнаружены ошибки: ${errorCount}`);
})();