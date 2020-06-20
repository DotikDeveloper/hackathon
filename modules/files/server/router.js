import express from "express";
import ImageFiles from "../ImageFiles";

const router = express.Router ();
import fs from 'fs';
import mime from 'mime';

router.get ('/imageFiles/:version/:_id',//TODO проверка доступа
    async function (req, res) {
        const version = req.params.version;
        /**@type ImageFiles*/
        let imageFile = await ImageFiles.findOne ({_id: req.params._id});
        if (!imageFile || !imageFile.versions[version]) {
            return res.status (404).send ('Файл не найден');
        }
        const fileVersion = imageFile.versions[version];

        fs.stat (fileVersion.path, (err, stat) => {
            if (err)
                return res.status (404).send ('Файл не найден');

            res.writeHead (200, {
                'Content-Type': mime.getType (imageFile.extension),
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename="${fileVersion.name}"`,
                'Accept-Ranges': 'none',//TODO ?
            });
            fs.createReadStream (fileVersion.path).pipe (res);
        });
    });

export default router;