const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

// Асинхронная функция для аутентификации и загрузки информации
(async () => {
    try {

        // Аутентификация с использованием учетных данных сервисного аккаунта
        const credentials = require('./secrets/credentials.json'); 
        // console.log(credentials);

        const serviceAccountAuth = new JWT({
            email: credentials.client_email, // Email сервисного аккаунта
            key: credentials.private_key, // Приватный ключ сервисного аккаунта
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Инициализация документа Google Spreadsheet
        const doc = new GoogleSpreadsheet('1V0dgN2KI3HEA9sn-u1LM6JRKDGXtbMaLu_DjymuhWds', serviceAccountAuth);

        // Загрузка информации о таблице
        await doc.loadInfo();
        console.log(`Название таблицы: ${doc.title}`); // Отображение названия таблицы
    } catch (error) {
        // Обработка ошибок
        console.error('Ошибка аутентификации или загрузки данных:', error);
    }
})();