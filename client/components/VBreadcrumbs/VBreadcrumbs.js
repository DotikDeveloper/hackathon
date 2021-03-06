import './VBreadcrumbs.sass'
import Vue from 'vue';
// Types

// Components
import { VBreadcrumbsDivider, VBreadcrumbsItem } from './index'

// Mixins
import Themeable from './Themeable'


export default Vue.extend({
    mixins:[Themeable],
    name: 'v-breadcrumbs',

    props: {
        divider: {
            type: String,
            default: '/',
        },
        items: {
            type: Array,
            default: () => ([]),
        },
        large: Boolean,
    },

    computed: {
        classes () {
            return {
                'v-breadcrumbs--large': this.large,
                ...this.themeClasses,
            }
        },
    },

    methods: {
        genDivider () {
            return this.$createElement(VBreadcrumbsDivider, this.$slots.divider ? this.$slots.divider : this.divider)
        },
        genItems () {
            const items = []
            const hasSlot = !!this.$scopedSlots.item
            const keys = []

            for (let i = 0; i < this.items.length; i++) {
                const item = this.items[i]

                keys.push(item.text)

                if (hasSlot)
                    items.push(this.$scopedSlots.item({ item }))
                else items.push(this.$createElement(VBreadcrumbsItem, { key: keys.join('.'), props: item }, [item.text]))
                        if (i < this.items.length - 1) items.push(this.genDivider())
                }

            return items
        },
    },

    render (h) {
        const children = this.$slots.default || this.genItems()

        return h('ul', {
            staticClass: 'v-breadcrumbs',
            class: this.classes,
        }, children)
    },
})