const moment = require( 'moment-timezone' );

function formatRuDateTime(date) {
    if(!date)
        return 'Не определено';
    return moment(date).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
}

async function delay() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
}

class MenuBlockMenuRunner extends MenuBlockRunner {

    async init() {
        /*if (this.menuItem.data.varname) {
          this.addVariables([{
            name: this.menuItem.data.varname,
            type: 'String',
            persist: true,
            visible: true
          }]);
        }*/
    }

    async run() {
        const slimbot = this.context.slimbot;
        const chat_id = this.context.session.meta.chat.id;

        let models = await FoodOffers.find();
        await _.eachLimit(models, 1, async (model) => {
            await slimbot.sendMessage(chat_id,
                [
                    `<a href="${model.link}"> Пост от ${formatRuDateTime(model.created)}</a>`,
                    model.text
                ].join( "\n\n" ),

                {parse_mode:'HTML'}
            );
            await delay();
            await _.eachLimit(model.images, 1, async (image) => {
                await delay();
                await slimbot.sendPhoto(chat_id, image);
            });
        });



    }
}

return MenuBlockMenuRunner;