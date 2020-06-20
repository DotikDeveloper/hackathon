import Vue from 'vue'
import VueApollo from "vue-apollo";
// eslint-disable-next-line no-unused-vars
import {createHttpLink} from "apollo-link-http";
import {InMemoryCache} from "apollo-cache-inmemory";
import {ApolloClient} from "apollo-client";
import { createUploadLink } from 'apollo-upload-client'
import createEJSONTransformerLink from './createEJSONTransformerLink';
import {ApolloLink} from "apollo-link";
import { WebSocketLink } from 'apollo-link-ws'
import { split } from 'apollo-link'
import { getMainDefinition } from 'apollo-utilities'

Vue.use(VueApollo);

function customFetch(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open(opts.method || 'get', url)

        for (let k in opts.headers || {}) xhr.setRequestHeader(k, opts.headers[k])

        xhr.onload = e =>
            resolve({
                ok: true,
                text: () => Promise.resolve(e.target.responseText),
                json: () => Promise.resolve(JSON.parse(e.target.responseText))
            });

        xhr.onerror = reject

        if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (opts.onprogress) {
                    opts.onprogress.apply(this, [event])
                }
            };
            xhr.upload.onload = function (event) {
                if (opts.onload) {
                    opts.onload.apply(this, [event])
                }
            };

            xhr.upload.onerror = function (event) {
                if (opts.onerror) {
                    opts.onerror.apply(this, [event])
                }
            };
        }
        xhr.send(opts.body)
    });
}

const transformerLink = createEJSONTransformerLink();
const uploadLink =  createUploadLink({
    uri: process.env.ROOT_URL+'/graphql?upload',
    fetch: typeof window === 'undefined' ? global.fetch : customFetch,
});

const wsLink = new WebSocketLink({
    uri: (process.env.ROOT_URL+'/graphql?websocket').replace(/^https?/i,(m)=>{
        if(m.toLowerCase()==='https')
            return 'wss';
        return 'ws'
    }),
    options: {
        reconnect: true,
    },
})

// Cache implementation
const cache = new InMemoryCache();

let appLink = ApolloLink.from([transformerLink,uploadLink]);

const link = split(
    // split based on operation type
    ({ query }) => {
        const definition = getMainDefinition(query)
        return definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
    },
    wsLink,
    appLink
)

const defaultOptions = {
    watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'ignore',
    },
    query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
    },
    connectToDevTools: true
}

const apolloClient = new ApolloClient({
    link: link,
    cache,
    defaultOptions,
    connectToDevTools: true
});
const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
});

export default apolloProvider;