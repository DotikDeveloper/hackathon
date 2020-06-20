import GraphQLJSON, {GraphQLJSONObject} from "./graphql-type-json";
import { GraphQLScalarType, Kind } from "graphql";
import EJSON from 'ejson';
import _ from 'underscore';
import {cloneDeep} from 'lodash';
import { makeExecutableSchema } from 'graphql-tools'
import LongScalar from 'graphql-type-long';
import sessionHandlerFactory from "../load/sessionHandler";
// eslint-disable-next-line no-unused-vars
const DateScalar = new GraphQLScalarType({
    name: "Date",
    description: "Date scalar type",
    parseValue(value) {
        return EJSON.parse(JSON.stringify(value));
    },
    serialize(value) {
        let objJson = JSON.parse(EJSON.stringify(value));
        //objJson.__typename = 'Date';
        return objJson;
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value); // value from the client query
        }
        return null;
    },
});

class ApolloServerConfig{
    constructor () {
        this.context = null;
        this.formatError = null;
        this.typeDefs = null;
        this.resolvers = {
            Long:LongScalar,
            Date:DateScalar,
            JSON: GraphQLJSON,
            JSONObject: GraphQLJSONObject,
            Query:{},
            Mutation:{}
        }
    }

    /**
     * @param {function} context
     * @returns {this}
     * */
    withContext(context){
        this.context = context;
        return this;
    }

    /**
     * @param {function} formatFn
     * @returns {this}
     * */
    withFormatError(formatFn){
        this.formatError = formatFn;
        return this;
    }

    /**
    * @returns {this}
    * */
    withTypeDefs(typeDefs){
        this.typeDefs = typeDefs;
        return this;
    }
    /**
     * @returns {this}
     **/
    withResolver(resolver,root=undefined){
        try {
            if (_.isFunction (resolver)) {
                resolver = new resolver ();
            }
            if (!root) {
                root = resolver.rootName;
            }
            const typeName = resolver.typeName ? _.upperFirst (resolver.typeName):_.upperFirst(root);

            let queries = resolver.resolver();
            if(!_.isEmpty(queries)) {
                this.resolvers.Query[root] = function () {
                    return {}
                };
                this.resolvers[typeName] = queries;
            }
            let mutations = resolver.mutations();
            if(!_.isEmpty(mutations)){
                this.resolvers.Mutation[root] = function () {
                    return {}
                };
                this.resolvers[`${typeName}Mutation`] = mutations;
            }

            let subscriptions = resolver.subscriptions();
            if(!_.isEmpty(subscriptions)) {
                this.resolvers.Subscription = this.resolvers.Subscription || {};

                _.each(subscriptions,(subValue,subName)=>{
                    this.resolvers.Subscription[subName] = subValue;
                });

            }

        }catch (e) {
            console.error(e);
        }
        return this;
    }

    /**
     * @returns {this}
     **/
    withResolvers(resolvers){
        _.each(resolvers,(resolver)=>{
            this.withResolver(resolver);
        });
        return this;
    }
    /**
     * @returns {object}
     * */
    build(){
        let resolvers = cloneDeep(this.resolvers);
        let schema = makeExecutableSchema({
            typeDefs:this.typeDefs,resolvers
        });
        return {
            schema,
            resolvers,
            context:this.context,
            formatError:this.formatError,
            //cors: { credentials: true/*, origin*/ },
            subscriptions: {
                onConnect: async (connectionParams, webSocket,ctx) => {
                    let sessionHandler = sessionHandlerFactory();
                    const req = ctx.request;
                    return await new Promise((resolve)=>{
                        sessionHandler(req, {},_  => {
                            return resolve( {
                                req
                            } ) ;
                        });
                    });
                }
            },
        };
    }
}

export default ApolloServerConfig;