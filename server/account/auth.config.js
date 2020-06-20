import {Strategy as JwtStrategy,ExtractJwt} from 'passport-jwt';
import Users from "/modules/account/Users";
import passport from 'passport';
import _ from 'underscore';
import {Strategy as VKontakteStrategy} from 'passport-vkontakte';
const settings = {
    secret:'logjlirgliefeoefeiwfheojefe',
};
import {get} from 'lodash';

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromExtractors([
    //ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    function (request){
        let s = request.cookies.jwtToken || request.headers.jwtToken;
        if(s&&_.isString(s)){
            s = s.replace(/^JWT\s*/gi,'');
        }
        return s;
    }
]);
opts.secretOrKey = settings.secret;
passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    Users.findOne({id: jwt_payload.id}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
}));
console.log(`process.env.BASE_URL:`,process.env.BASE_URL);
passport.use(new VKontakteStrategy({
        clientID:     '7506042', // VK.com docs call it 'API ID', 'app_id', 'api_id', 'client_id' or 'apiId'
        clientSecret: 'LyQHNDL8HXceTBUD6KcV',
        callbackURL:  `${process.env.BASE_URL}_oauth/vk`,
        apiVersion:'5.107'
    },
    async function(accessToken, refreshToken, params, profile, done) {
        let user = await Users.findOne({
            'passport.vk.id':profile.id
        });
        if(user) {
            user.passport.vk.accessToken = accessToken;
            user.avatar = get(profile,'photos[0].value',null);
            await user.save();
            return done(null, user);
        }
        user = new Users({
            login:profile.username,
            type:'vk',
            name:profile.displayName,
            avatar:get(profile,'photos[0].value',null),
            passport:{
                vk:{
                    id:profile.id,
                    accessToken:accessToken
                }
            }
        });
        await user.save();
        return done(null,user);
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    Users.findOne({_id:user._id}).then((user)=>{
        done(null, user);
    });
});

export default settings;