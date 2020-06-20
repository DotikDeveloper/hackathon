import Routable from './Routable'
import Vue from 'vue';
const VBreadcrumbsItem = Vue.extend({
    name: 'v-breadcrumbs-item',
    mixins:[Routable],
    props: {
        // In a breadcrumb, the currently
        // active item should be dimmed
        activeClass: {
            type: String,
            default: 'v-breadcrumbs__item--disabled',
        },
        ripple: {
            type: [Boolean, Object],
            default: false,
        },
    },

    computed: {
        classes () {
            return {
                'v-breadcrumbs__item': true,
                [this.activeClass]: this.disabled,
            }
        },
    },

    render (h) {
        const { tag, data } = this.generateRouteLink()

        return h('li', [
            h(tag, {
                ...data,
                attrs: {
                    ...data.attrs,
                    'aria-current': this.isActive && this.isLink ? 'page' : undefined,
                },
            }, this.$slots.default),
        ])
    },
})

/* @vue/component */
export default VBreadcrumbsItem;