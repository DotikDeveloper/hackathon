import express from "express";
import path from 'path';

/**
 * @param {object} options
 * @param {string} options.model
 * */
export default function (options) {
    const router = express.Router ();
    router.get (`/${options.model.modelName}/:version/:_id`,//TODO проверка доступа
async function (req, res) {
            const version = req.params.version;
            /**@type TmpFiles*/
            const fileModel = await options.model.findOne ({_id: req.params._id});
            if (!fileModel || !fileModel.versions || !fileModel.versions[version]) {
                return res.status(404).send ('Файл не найден');
            }
            const fileVersion = fileModel.versions[version];
            try {
                const stream = await fileModel.createReadStream (version);
                const fileName = fileVersion.name || path.basename (fileVersion.path);
                res.writeHead (200, {
                    'Content-Type': fileVersion.type,
                    'Content-Length': fileVersion.size,
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'Accept-Ranges': 'none',//TODO ?
                });
                stream.pipe(res);
            } catch (e) {
                return res.status (404).send ('Файл не найден');
            }
        }
    );
    return router;
}