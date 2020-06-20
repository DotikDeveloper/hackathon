import Cabinet from "../components/Cabinet";

export default [
    {
        path: '/cabinet',
        name: 'cabinet',
        component: Cabinet,
        meta: {
            breadcrumbs:{
                label:'Кабинет',
                parent:'home'
            }
        },
    },
]