import express from "express";
import TmpFiles from "../TmpFiles";
const router  = express.Router();
import fs from 'fs';

router.get('/tmpFiles/:version/:_id',//TODO проверка доступа
    async function(req, res){
                const version = req.params.version;
                /**@type TmpFiles*/
                let tmpFile = await TmpFiles.findOne({_id:req.params._id});
                if(!tmpFile||!tmpFile.versions[version]){
                     return res.status(404).send('Файл не найден');
                }
                const fileVersion = tmpFile.versions[version];

                fs.stat(fileVersion.path, (err, stat) => {
                    if(err)
                        return res.status(404).send('Файл не найден');
                    res.writeHead(200, {
                        'Content-Type': fileVersion.type,
                        'Content-Length': stat.size,
                        'Content-Disposition':`attachment; filename="${fileVersion.name}"`,
                        'Accept-Ranges': 'none',//TODO ?
                    });
                    fs.createReadStream(fileVersion.path).pipe(res);
                });
            });

export default router;