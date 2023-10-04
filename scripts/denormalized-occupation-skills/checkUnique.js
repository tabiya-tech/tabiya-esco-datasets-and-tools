const fs = require('fs');
const {parse, stringify} = require("csv/sync");

const data = fs.readFileSync('/home/jacob/Projects/tabiya-esco-datasets-and-tools/datasets/tabiya/esco-v1.1.1/csv/occupations.csv', 'utf8');
const records = parse(data, {columns: true});

const output = [];
for (let i = 0; i < records.length; i++) {
    const record = records[i];
    for (let j = 0; j < records.length; j++) {
        const otherRecord = records[j];
        if(record['CODE'] !== otherRecord['CODE']) {
            const foundRecord = output.find(rc => rc['OCCUPATION 2 ESCO CODE'] === record['CODE'] && rc['OCCUPATION 1 ESCO CODE'] === otherRecord['CODE']);
            if(!foundRecord) {
                const otherRecordLabels = otherRecord['ALTLABELS'].split('\n');
                const recordLabels = record['ALTLABELS'].split('\n');
                const bigArr = recordLabels.length >= otherRecordLabels.length ? recordLabels : otherRecordLabels;
                const smallArr = otherRecordLabels.length <= recordLabels.length ? otherRecordLabels : recordLabels;
                const commonLabels = [];
                for (let d = 0; d < bigArr.length; d++) {
                    const label = bigArr[d];
                    if (smallArr.includes(label)) {
                        commonLabels.push(label);
                    }
                }
                if(commonLabels.length > 0) {
                    output.push({
                        'OCCUPATION 1 ESCO CODE': record['CODE'],
                        'OCCUPATION 1 PREFERRED LABEL': record['PREFERREDLABEL'],
                        'OCCUPATION 1 LABELS': record['ALTLABELS'],
                        'OCCUPATION 2 ESCO CODE': otherRecord['CODE'],
                        'OCCUPATION 2 PREFERRED LABEL': otherRecord['PREFERREDLABEL'],
                        'OCCUPATION 2 LABELS': otherRecord['ALTLABELS'],
                        'COMMON LABELS': commonLabels.join('\n')
                    });
                }
            }
        }
    }
}

fs.writeFileSync('./conflicting-occupations.csv', stringify(output, {header: true}));
console.log('done');