<script>

    import FullCalendar from '@fullcalendar/vue'
    import dayGridPlugin from '@fullcalendar/daygrid'
    import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
    import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
    import interactionPlugin from '@fullcalendar/interaction';
    import listPlugin from '@fullcalendar/list';
    export default {
        components: {
            FullCalendar // make the <FullCalendar> tag available
        },
        data () {
            return {
                calendarPlugins: [interactionPlugin, dayGridPlugin, listPlugin,
                    resourceTimeGridPlugin,resourceTimelinePlugin],
                props: {
                    now: '2020-02-07',
                    editable: true,
                    header: {
                        left: 'today prev,next',
                        center: 'title',
                        right: 'resourceTimelineDay,resourceTimelineThreeDays,timeGridWeek,dayGridMonth,listWeek'
                    },
                    views: {
                        resourceTimelineThreeDays: {
                            type: 'resourceTimeline',
                            duration: { days: 3 },
                            buttonText: '3 days'
                        }
                    },
                    resources: [
                        {id: 'a', title: 'Auditorium A'},
                        {id: 'b', title: 'Auditorium B', eventColor: 'green'},
                        {id: 'c', title: 'Auditorium C', eventColor: 'orange'},
                        {
                            id: 'd', title: 'Auditorium D', children: [
                                {id: 'd1', title: 'Room D1'},
                                {id: 'd2', title: 'Room D2'}
                            ]
                        },
                        {id: 'e', title: 'Auditorium E'},
                        {id: 'f', title: 'Auditorium F', eventColor: 'red'},
                        {id: 'g', title: 'Auditorium G'},
                        {id: 'h', title: 'Auditorium H'},
                        {id: 'i', title: 'Auditorium I'},
                        {id: 'j', title: 'Auditorium J'},
                        {id: 'k', title: 'Auditorium K'},
                        {id: 'l', title: 'Auditorium L'},
                        {id: 'm', title: 'Auditorium M'},
                        {id: 'n', title: 'Auditorium N'},
                        {id: 'o', title: 'Auditorium O'},
                        {id: 'p', title: 'Auditorium P'},
                        {id: 'q', title: 'Auditorium Q'},
                        {id: 'r', title: 'Auditorium R'},
                        {id: 's', title: 'Auditorium S'},
                        {id: 't', title: 'Auditorium T'},
                        {id: 'u', title: 'Auditorium U'},
                        {id: 'v', title: 'Auditorium V'},
                        {id: 'w', title: 'Auditorium W'},
                        {id: 'x', title: 'Auditorium X'},
                        {id: 'y', title: 'Auditorium Y'},
                        {id: 'z', title: 'Auditorium Z'}
                    ],
                    // eslint-disable-next-line no-unused-vars
                    events: function(info, successCallback, failureCallback) {

                        successCallback([
                            {
                                id: '1',
                                resourceId: 'b',
                                start: new Date( '2020-02-07T02:00:00' ),
                                end: '2020-02-07T07:00:00',
                                title: 'event 1'
                            },
                            {
                                id: '2',
                                resourceId: 'c',
                                start: '2020-02-07T05:00:00',
                                end: '2020-02-07T22:00:00',
                                title: 'event 2'
                            },
                            {id: '3', resourceId: 'd', start: '2020-02-06', end: '2020-02-08', title: 'event 3'},
                            {
                                id: '4',
                                resourceId: 'e',
                                start: '2020-02-07T03:00:00',
                                end: '2020-02-07T08:00:00',
                                title: 'event 4'
                            },
                            {
                                id: '5',
                                resourceId: 'f',
                                start: '2020-02-07T00:30:00',
                                end: '2020-02-07T02:30:00',
                                title: 'event 5'
                            }
                        ]);
                    }
                }
            }
        }
    }

</script>

<template>
    <FullCalendar defaultView="resourceTimelineDay"
                  schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
                  :plugins="calendarPlugins"
                  :weekends="false"
                  v-bind="props"
                  resourceLabelText='Rooms'
                  ref="fullCalendar"
    />
</template>

<style lang='scss'>

    @import '~@fullcalendar/core/main.css';
    //@import '~@fullcalendar/daygrid/main.css';
    //@import '~@fullcalendar/timeline/main.css';
    //@import '~@fullcalendar/resource-timeline/main.css';

    @import '~@fullcalendar/timegrid/main.css';
</style>