<template>
    <div class="vue-codemirror" :class="{ merge }">
        <div ref="mergeview" v-if="merge"></div>
        <textarea ref="textarea" :name="name" v-model="value" :placeholder="placeholder" v-else></textarea>
    </div>
</template>

<script>
    import CodeMirror from './codemirror.global';
    import _ from 'underscore';
    import EJSON from 'ejson';
    import cmResize from 'cm-resize';

    export default {
        name: 'codemirror',
        data() {
            return {
                content: '',
                codemirror: null,
                cminstance: null
            }
        },
        props: {
            code: String,
            value: String,
            marker: Function,
            unseenLines: Array,
            name: {
                type: String,
                default: 'codemirror'
            },
            placeholder: {
                type: String,
                default: ''
            },
            merge: {
                type: Boolean,
                default: false
            },
            options: {
                type: Object,
                default: () => ({})
            },
            events: {
                type: Array,
                default: () => ([])
            },
            globalOptions: {
                type: Object,
                default: () => ({})
            },
            globalEvents: {
                type: Array,
                default: () => ([])
            }
        },
        watch: {
            options: {
                deep: true,
                handler(options) {
                    for (const key in options) {
                        this.cminstance.setOption(key, options[key])
                    }
                }
            },
            merge() {
                this.$nextTick(this.switchMerge)
            },
            code(newVal) {
                this.handerCodeChange(newVal)
            },
            value(newVal) {
                this.handerCodeChange(newVal)
            },
        },
        methods: {
            initialize() {
                const getSelectedRange=()=>{
                    return { from: this.cminstance.getCursor(true), to: this.cminstance.getCursor(false) };
                };

                const autoFormatSelection=()=>{
                    var range = getSelectedRange();
                    this.cminstance.autoFormatRange(range.from, range.to);
                };

                const cmOptions = EJSON.parse( EJSON.stringify( Object.assign({}, this.globalOptions, this.options) ) );
                cmOptions.extraKeys = {"Ctrl-Alt-L":autoFormatSelection};
                console.log({cmOptions});
                if (this.merge) {
                    this.codemirror = CodeMirror.MergeView(this.$refs.mergeview, cmOptions);
                    this.codemirror.setOption('lint', { options: { quotmark: true }});
                    this.cminstance = this.codemirror.edit
                } else {
                    this.codemirror = CodeMirror.fromTextArea(this.$refs.textarea, cmOptions);
                    this.cminstance = this.codemirror;
                    let value = this.code || this.value || this.content;
                    if(!_.isString(value))
                        value = '';
                    this.cminstance.setValue(value );
                    this.codemirror.refresh();
                }
                this.cminstance.on('change', cm => {
                    this.content = cm.getValue()
                    if (this.$emit) {
                        this.$emit('input', this.content)
                    }
                });
                if(cmOptions.resize){
                    cmResize(this.codemirror,cmOptions.resize);
                }
                const tmpEvents = {}
                // eslint-disable-next-line no-unused-vars
                const allEvents = [
                    'scroll',
                    'changes',
                    'beforeChange',
                    'cursorActivity',
                    'keyHandled',
                    'inputRead',
                    'electricInput',
                    'beforeSelectionChange',
                    'viewportChange',
                    'swapDoc',
                    'gutterClick',
                    'gutterContextMenu',
                    'focus',
                    'blur',
                    'refresh',
                    'optionChange',
                    'scrollCursorIntoView',
                    'update'
                ]
                .concat(this.events)
                .concat(this.globalEvents)
                .filter(e => (!tmpEvents[e] && (tmpEvents[e] = true)))
                .forEach(event => {
                    // 循环事件，并兼容 run-time 事件命名
                    this.cminstance.on(event, (...args) => {
                        // console.log('当有事件触发了', event, args)
                        this.$emit(event, ...args)
                        const lowerCaseEvent = event.replace(/([A-Z])/g, '-$1').toLowerCase()
                        if (lowerCaseEvent !== event) {
                            this.$emit(lowerCaseEvent, ...args)
                        }
                    })
                })



                this.$emit('ready', this.codemirror)
                this.unseenLineMarkers()
                // prevents funky dynamic rendering
                this.refresh()
            },
            refresh() {
                this.$nextTick(() => {
                    this.cminstance.refresh()
                })
            },
            destroy() {
                // garbage cleanup
                const element = this.cminstance.doc.cm.getWrapperElement()
                element && element.remove && element.remove()
            },
            handerCodeChange(newVal) {
                newVal = _.isString(newVal)?newVal:'';
                const cm_value = this.cminstance.getValue();
                if (newVal !== cm_value) {
                    const scrollInfo = this.cminstance.getScrollInfo();
                    this.cminstance.setValue(newVal);
                    this.content = newVal;
                    this.cminstance.scrollTo(scrollInfo.left, scrollInfo.top);
                }
                this.unseenLineMarkers()
            },
            unseenLineMarkers() {
                if (this.unseenLines !== undefined && this.marker !== undefined) {
                    this.unseenLines.forEach(line => {
                        const info = this.cminstance.lineInfo(line)
                        this.cminstance.setGutterMarker(line, 'breakpoints', info.gutterMarkers ? null : this.marker())
                    })
                }
            },
            switchMerge() {
                // Save current values
                const history = this.cminstance.doc.history
                const cleanGeneration = this.cminstance.doc.cleanGeneration
                this.options.value = this.cminstance.getValue()
                this.destroy()
                this.initialize()
                // Restore values
                this.cminstance.doc.history = history
                this.cminstance.doc.cleanGeneration = cleanGeneration
            }
        },
        mounted() {
            this.initialize()
        },
        beforeDestroy() {
            this.destroy()
        }
    }
</script>

<style>
    .cm-resize-handle{
        display:block;position:absolute;bottom:0;right:0;z-index:99;width:18px;height:18px;
        background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0,0 16,16'%3E%3Cpath stroke='gray' stroke-width='2' d='M-1,12 l18,-18 M-1,18 l18,-18 M-1,24 l18,-18 M-1,30 l18,-18'/%3E%3C/svg%3E") center/cover;
        box-shadow:inset -1px -1px 0 0 silver;cursor:nwse-resize
    }
</style>