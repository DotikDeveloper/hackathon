import FoodSourceTypes from "../../modules/food/models/FoodSourceTypes";
import _ from 'underscore';
import FoodOffers from "../../modules/food/models/FoodOffers";
import GeoContext from "/modules/geo/classes/GeoContext";
import YaGeoCoder from "../../modules/geo/classes/YaGeoCoder";
const easyvk = require("easyvk")

//Authenticating user
easyvk({
    token:'08275a1a7b603782297cf3456ca76a60c72031f9221c3ff59302fd0e71eed52b5defb8cfa776f2cbb796d',
    //username: '79176518275',
    //password: 'kv7QBQx1',
    save: false,
}).then(vk => {
//return;
    //Getting user id from authenticated session
    //let me = vk.session.user_id;



    (async ()=>{

        /**@type {FoodSourceTypes}*/
        let sourceType = await FoodSourceTypes.findOne({sysName:'vkGroups'}).populate('foodSources');

        _.mapAsync(sourceType.foodSources,/**@param {FoodSources}*/async (foodSource)=>{
            if(!foodSource.active)
                return;
            if(!foodSource.data.gid){
                let screen_name = foodSource.data.link.replace(/^.*\//,'');
                try{
                    let response = await vk.call('utils.resolveScreenName', {
                        screen_name
                    });
                    if(response&&response.object_id){
                        foodSource.data.gid = response.object_id;
                        foodSource.markModified('data');
                    }else{
                        gid = screen_name.replace(/[^\d]/,'');
                        if(gid){
                            foodSource.data.gid = response.object_id;
                            foodSource.markModified('data');
                        }
                    }
                    if(foodSource.isModified('data')){
                        await foodSource.save();
                    }
                    if(!foodSource.data.gid)
                        return ;
                }catch (e) {
                    return console.error(e);
                }
            }
            let gid = foodSource.data.gid;


            let response = await vk.call('wall.get', {
                owner_id: `-${gid}`,
                count: 10,
                extended: 1,
                fields: 'city'
            });
            await _.mapAsync(response.items,async (post)=>{
                const created = new Date(post.date*1000);
                if(created.getTime()<Date.now()-24*3600*1000)
                    return;

                let link = `${foodSource.data.link}?w=wall-${gid}_${post.id}`;
                let model = await FoodOffers.findOne({link});
                if(model)
                model.remove();
                model = null;
                if(!model){
                    let photos = _.chain(post.attachments)
                    .filter((attach)=>{
                        return attach.type === 'photo';
                    })
                    .pluck('photo')
                    .value();

                    /**@type {FoodOffers}*/
                    model = new FoodOffers({
                        link,
                        text:post.text,
                        created,
                        images:photos
                        .map((photo)=>{
                            let sizes = photo.sizes;
                            let targetSizes = [];
                            _.each(sizes,(size)=>{
                                if(['y','z','w'].indexOf(size.type) > -1){
                                    targetSizes.push(size);
                                }
                            });
                            if(!_.isEmpty(targetSizes)){
                                return _.chain(targetSizes)
                                .sortBy('size')
                                .first().value().url;
                            }
                            return _.sample(sizes)?.url;
                        }),
                        food_source_id:foodSource._id,
                        expiries:new Date(post.date*1000+8*3600*1000),
                        active:true
                    });

                    model.geoPoints = _.chain(photos)
                    .filter((photo)=>{
                        return photo.lat && photo.long;
                    })
                    .map((photo)=>{
                        return {
                            lat:photo.lat,
                            long:photo.long,
                            type:'photo'
                        }
                    })
                    .value();

                    if(!_.isEmpty(model.geoPoints)){
                        let point = _.first(model.geoPoints);
                        const geoCoder = new YaGeoCoder().withOneResult();
                        let result = await geoCoder.query(`${point.long} ${point.lat}`);
                        if(result) {
                            model.exactGeo = result.data;
                        }
                    }

                    let regionNames = _.clone(foodSource.geoNames);
                    let uid = post.from_id;
                    if(uid){
                        let profile = _.find(response.profiles,(profile)=>{
                            return profile.id === uid;
                        });
                        let cityName = profile?.city?.title;
                        if(cityName&&regionNames.indexOf(cityName)==-1){
                            regionNames.push(cityName);
                        }
                    }

                    const geoContext = new GeoContext().withRegionNames(regionNames);

                    let geoText = post.text.replace(/\[[а-яa-z\d\s]+\|[а-яa-z\d\s]*\]\s*[а-яa-z\d]*/gi,' ');
                    let geos = await geoContext.parseGeos(geoText);
                    model.possibleGeos = _.pluck(geos,'data');

                    await model.save()
                }


            });

        })

    })();




}).catch(console.error)