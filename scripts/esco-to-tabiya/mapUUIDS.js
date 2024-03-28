const fs = require('fs');
const {parse} = require('csv/sync');
const {stringify} = require('csv/sync');

module.exports = function matchAndAppendUUIDs(sourceCSVPath, targetCSVPath, validatorHeader, outputPath) {
    // Read and parse both CSV files
    const sourceCSV = fs.readFileSync(sourceCSVPath, 'utf8');
    const recordsSource = parse(sourceCSV, { columns: true });
    const targetCSV = fs.readFileSync(targetCSVPath, 'utf8');
    let recordsTarget = parse(targetCSV, { columns: true });

    // Map validator values to UUIDs from Source csv
    const validatorToUUIDMap = new Map();
    recordsSource.forEach(record => {
        validatorToUUIDMap.set(record[validatorHeader], record['UUIDHISTORY']);
    });

    // Append UUIDs from Source to corresponding items in target
    recordsTarget = recordsTarget.map(record => {
        const validatorValue = record[validatorHeader];
        const uuid = validatorToUUIDMap.get(validatorValue);
        if (uuid) {

            record['UUIDHISTORY'] = record['UUIDHISTORY'] ? `${record['UUIDHISTORY']}\n${uuid}` : uuid;
        } else {
            console.warn('No UUID found for', validatorValue);
        }
        return record;
    });

    const outputCsv = stringify(recordsTarget, { header: true });
    fs.writeFileSync(outputPath, outputCsv, 'utf8');
    console.log(validatorToUUIDMap.size, 'UUIDs appended to', outputPath);
}