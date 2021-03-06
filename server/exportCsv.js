import CsvTransform from "../modules/import/fs/CsvTransform";
import {ReaderHeaders} from "../modules/import/fs/headers";
import _ from 'underscore';
const Transform = require('stream').Transform;
const stringify = require('csv-stringify');
const fs = require('fs');
const assert = require('assert')
const data = []
/*const stringifier = stringify({
    delimiter: ':'
})
stringifier.on('readable', function(){
    let row;
    while(row = stringifier.read()){
        data.push(row)
    }
})
stringifier.on('error', function(err){
    console.error(err.message)
})
stringifier.on('finish', function(){
    assert.equal(
        data.join(''),
        "root:x:0:0:root:/root:/bin/bash\n" +
        "someone:x:1022:1022::/home/someone:/bin/bash\n"
    )
})
stringifier.write([ 'root','x','0','0','root','/root','/bin/bash' ])
stringifier.write([ 'someone','x','1022','1022','','/home/someone','/bin/bash' ])
stringifier.end()
*/

const catData = {
    90521: "Другое",
    91309: "Молочные продукты",
    91311: "Молочные продукты",
    91313: "Молочные продукты",
    91321: "Готовые блюда",
    91324: "Мясо",
    91327: "Бакалея",
    91329: "Бакалея",
    91330: "Бакалея",
    91331: "Готовые блюда",
    91332: "Бакалея",
    91335: "Другое",
    91339: "Готовые блюда",
    91340: "Хлеб, выпечка",
    91342: "Хлеб, выпечка",
    91343: "Бакалея",
    91344: "Бакалея",
    91345: "Другое",
    91346: "Бакалея",
    91352: "Напитки",
    91382: "Фрукты-овощи",
    91384: "Фрукты-овощи",
    91388: "Фрукты-овощи",
    91389: "Фрукты-овощи",
    91392: "Бакалея",
    91397: "Напитки",
    91405: "Хлеб, выпечка",
    91408: "Хлеб, выпечка",
    91410: "Рыба и морепродукты",
    91413: "Рыба и морепродукты",
    91414: "Рыба и морепродукты",
    91416: "Рыба и морепродукты",
    91419: "Готовые блюда",
    91420: "Готовые блюда",
    91421: "Готовые блюда",
    91422: "Готовые блюда",
    91423: "Фрукты-овощи",
    91427: "Другое",
    91430: "Хлеб, выпечка",
    469555: "Другое",
    818944: "Бакалея",
    818955: "Фрукты-овощи",
    982439: "Молочные продукты",
    1039107: "Другое",
    4922657: "Другое",
    5017502: "Другое",
    12718332: "Другое",
    13212400: "Другое",
    13212408: "Другое",
    13337703: "Готовые блюда",
    13360738: "Детское питание",
    13360751: "Детское питание",
    13360765: "Детское питание",
    13360776: "Детское питание",
    13462703: "Бакалея",
    14247341: "Другое",
    14247369: "Другое",
    14255967: "Другое",
    14256102: "Другое",
    14420129: "Молочные продукты",
    14420217: "Молочные продукты",
    14621180: "Другое",
    14698852: "Бакалея",
    14706137: "Другое",
    15368134: "Напитки",
    15521886: "Другое",
    15557928: "Готовые блюда",
    15685457: "Другое",
    15685787: "Другое",
    15714105: "Детское питание",
    15714106: "Бакалея",
    15714122: "Хлеб, выпечка",
    15714127: "Хлеб, выпечка",
    15714129: "Хлеб, выпечка",
    15714135: "Бакалея",
    15714542: "Хлеб, выпечка",
    15714675: "Хлеб, выпечка",
    15714680: "Готовые блюда",
    15714682: "Готовые блюда",
    15714708: "Фрукты-овощи",
    15714713: "Другое",
    15719801: "Бакалея",
    15719821: "Молочные продукты",
    15719828: "Бакалея",
    15720032: "Бакалея",
    15720034: "Бакалея",
    15720037: "Бакалея",
    15720039: "Бакалея",
    15720045: "Другое",
    15720050: "Бакалея",
    15720051: "Бакалея",
    15720054: "Бакалея",
    15720056: "Бакалея",
    15720120: "Мясо",
    15720137: "Молочные продукты",
    15720146: "Молочные продукты",
    15720149: "Молочные продукты",
    15720184: "Молочные продукты",
    15720296: "Молочные продукты",
    15720380: "Молочные продукты",
    15720388: "Молочные продукты",
    15720395: "Молочные продукты",
    15726400: "Напитки",
    15726402: "Напитки",
    15726404: "Напитки",
    15726408: "Напитки",
    15726410: "Напитки",
    15726412: "Напитки",
    15727465: "Готовые блюда",
    15727468: "Мясо",
    15727473: "Готовые блюда",
    15727545: "Готовые блюда",
    15727549: "Хлеб, выпечка",
    15727553: "Готовые блюда",
    15727557: "Мясо",
    15727559: "Рыба и морепродукты",
    15727562: "Мясо",
    15727567: "Фрукты-овощи",
    15727616: "Рыба и морепродукты",
    15727830: "Мясо",
    15727878: "Рыба и морепродукты",
    15727886: "Фрукты-овощи",
    15727896: "Фрукты-овощи",
    15727944: "Фрукты-овощи",
    15727954: "Готовые блюда",
    15728039: "Готовые блюда",
    15752213: "Рыба и морепродукты",
    15752233: "Рыба и морепродукты",
    15752238: "Готовые блюда",
    15753350: "Мясо",
    15753353: "Мясо",
    15753363: "Мясо",
    15753372: "Мясо",
    15753377: "Мясо",
    15753386: "Мясо",
    15753403: "Мясо",
    15756952: "Готовые блюда",
    15757210: "Готовые блюда",
    15770934: "Другое",
    15770939: "Другое",
    15834733: "Готовые блюда",
    15870267: "Детское питание",
    15937809: "Хлеб, выпечка",
    15963668: "Другое",
    15971367: "Другое",
    15999143: "Другое",
    15999360: "Другое",
    16011677: "Бакалея",
    16011704: "Бакалея",
    16011796: "Бакалея",
    16044387: "Бакалея",
    16044416: "Бакалея",
    16044466: "Напитки",
    16044621: "Бакалея",
    16074648: "Другое",
    16099944: "Молочные продукты",
    16155448: "Напитки",
    16155455: "Напитки",
    16155466: "Напитки",
    16155476: "Напитки",
    16155504: "Напитки",
    16155526: "Напитки",
    16155560: "Напитки",
    16155587: "Напитки",
    16155647: "Напитки",
    16155651: "Напитки",
    16335303: "Детское питание",
    16593082: "Напитки"
}

let count = 0;
let foodCount = 0;
let interval = setInterval(()=>{
    console.log('export rows:',count,'foodCount:',foodCount);

},10000);
let fileReader = fs.createReadStream('/home/vlad/ya_models.csv')
.pipe(new CsvTransform({
    encoding: 'utf8',
    header: true,
    delimiter: ';',
    disableQuote:false
})).pipe(
    new Transform({
        objectMode: true,
        transform: function(data,encoding, callback) {
            if(data instanceof ReaderHeaders){
                return callback(null,
                    ['name','category']
                )
            }else {
                count++;
                let name = data[1];
                let category_id = Number( data[3] );
                if(catData[category_id]){
                    foodCount++;
                    return callback(null,[name,catData[category_id]]);
                }
                callback();
            }

        }
    })
).pipe(
    stringify({
        delimiter: ';'
    })

).pipe(fs.createWriteStream('/home/vlad/WebstormProjects/hackathon/.storage/export.csv'))
.once('end',()=>{
    console.log('EXPORT ENDED');
    clearInterval(interval);
})