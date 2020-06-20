import VBreadcrumbs from './VBreadcrumbs'
import VBreadcrumbsItem from './VBreadcrumbsItem'
import Vue from 'vue';
export function createSimpleFunctional (
    c,
    el = 'div',
    name
) {
    return Vue.extend({
        name: name || c.replace(/__/g, '-'),

        functional: true,

        render (h, { data, children }) {
            data.staticClass = (`${c} ${data.staticClass || ''}`).trim()

            return h(el, data, children)
        },
    })
}

const VBreadcrumbsDivider = createSimpleFunctional('v-breadcrumbs__divider', 'li')

export { VBreadcrumbs, VBreadcrumbsItem, VBreadcrumbsDivider }

