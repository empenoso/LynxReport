/**
 * LynxReport: учёт публикаций 📚 [Google Apps Script Release]
 * Скачивает просмотры, комментарии, закладки (если доступно), рейтинг (если доступно) из статей.
 *
 * Суммирование нарастающим итогом [sumColumn.gs]
 * 
 * @author Mikhail Shardin [Михаил Шардин] 
 * @site https://shardin.name/
 * 
 * Last updated: 02.05.2024
 * 
 */

function sumAndInsertToAnotherSheet() {
    // Source and destination sheet variables
    var sourceSheetName = "Данные"; // Change this to the name of the source sheet
    var destinationSheetName = "Нарастающий"; // Change this to the name of the destination sheet

    // Columns to sum in the source sheet
    var columnsToSum = [8, 9, 10, 11]; // Change these to the column numbers you want to sum (A=1, B=2, etc.)

    // Open the source and destination sheets
    var sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sourceSheetName);
    var destinationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(destinationSheetName);

    // Get the last row of the source sheet
    var lastRow = sourceSheet.getLastRow();

    // Get the current date
    var currentDate = new Date();

    // Initialize an array to store the sums for each column
    var sums = [];

    // Iterate over each column to sum
    columnsToSum.forEach(function(columnToSum) {
        // Get the values from the specified column in the source sheet
        var valuesToSum = sourceSheet.getRange(1, columnToSum, lastRow, 1).getValues();

        // Calculate the sum of the numeric values
        var sum = 0;
        for (var i = 0; i < valuesToSum.length; i++) {
            Logger.log(`Шаг ${i} = ${valuesToSum[i][0]}`)
            var value = valuesToSum[i][0];
            if (!isNaN(value) && value !== "" && value !== "?" && typeof value === "number") {
                sum += value;
            }
        }

        // Store the sum for this column
        sums.push(sum);
    });

    // Insert the current date and sums into the last row of the destination sheet
    var lastRowDestination = destinationSheet.getLastRow() + 1;
    destinationSheet.getRange(lastRowDestination, 1).setValue(currentDate);
    for (var i = 0; i < sums.length; i++) {
        destinationSheet.getRange(lastRowDestination, i + 2).setValue(sums[i]);
    }
}