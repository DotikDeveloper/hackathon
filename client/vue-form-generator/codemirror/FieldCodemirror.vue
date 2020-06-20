<template>
    <div style="width: 100%;">
        <codemirror
                :name="schema.model"
                v-model="value"
                :options="codeMirrorOptions"
                @input="onCodeMirrorChange($event)"
        >
    </codemirror>
    </div>
</template>

<script>
    import abstractField from './../fields/abstractField';
    import EJSON from 'ejson';
    import codemirror from './../codemirror/codemirror';
    export default {
        name: 'FieldCodemirror',
        mixins: [ abstractField ],
        components:{
            codemirror:codemirror
        },
        computed:{
            codeMirrorOptions(){
                let opts = {};
                if(this.schema.codeMirrorOptions){
                    opts = EJSON.clone(this.schema.codeMirrorOptions);
                }
                opts.autoRefresh = true;
                return opts;
            }
        },
        methods:{
            onCodeMirrorChange($event){
                console.log('onCodeMirrorChange:','$event:',$event);
            }
        }
    }
</script>