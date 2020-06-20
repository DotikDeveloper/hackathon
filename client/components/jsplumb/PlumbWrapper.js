import {EventEmitter} from 'events';
import jsPlumb from "./jsplumb";
import _ from 'underscore';
import $ from 'jquery';

export default
class PlumbWrapper extends EventEmitter{

    constructor(){
        super();
        jsPlumb.ready(()=>{
            if(this.instance)
                return;
            const instance = jsPlumb.getInstance({
                Endpoint: ["Dot", {radius: 2}],
                Connector: "StateMachine",
                HoverPaintStyle: {stroke: "#1e8151", strokeWidth: 2},
                ConnectionOverlays: [
                    ["Arrow", {
                        location: 1,
                        id: "arrow",
                        length: 14,
                        foldback: 0.8
                    }],
                    ["Label", {label: "", id: "label", cssClass: "aLabel"}]
                ],
                Container: "canvas"
            });

            instance.registerConnectionType("basic", {anchor: "Continuous", connector: "StateMachine"});

            instance.bind("click", (connection)=>{
                console.log('click',{connection});
                this.emit('selectConnection',connection);
            });

            instance.bind("connection", (info)=>{
                this.emit('connection',info);
            });
            this.instance = instance;
            setTimeout(()=>{
                this.emit('ready');
            },0);
        });

        this.hardRepaintLaiter = _.debounce(()=>{
            $('.menuItem').each((index,$el)=>{
                this.instance.revalidate( $el );
            });
        },500);
    }

    initNode(el,change) {
        //jsPlumb.ready( ()=> {
            // initialise draggable elements.
            this.instance.draggable(el,{stop:function(e){
                var $this = $(e.el);
                var left = parseInt( $this.css('left') );
                var top = parseInt( $this.css('top') );
                change({
                    left:left,
                    top:top
                });


                //$this.find('[name$=top]').val( left );
                //$this.find('[name$=left]').val( top );
                //var sourceModel = MenuItemsLocal.findOne({_id:$this.attr('id')});
                //sourceModel.updateFromForm(MalibunAction.data.formId,$this.attr('autoform-name'),{left:left,top:top});
            }});

            this.instance.makeSource(el, {
                filter: ".ep",
                anchor: "Continuous",
                connectorStyle: {stroke: "#5c96bc", strokeWidth: 2, outlineStroke: "transparent", outlineWidth: 4},
                connectionType: "basic",
                extract: {
                    "action": "the-action"
                },
                maxConnections: 100,
                // eslint-disable-next-line no-unused-vars
                onMaxConnections: function (info, e) {
                    alert("Maximum connections (" + info.maxConnections + ") reached");
                }
            });

            this.instance.makeTarget(el, {
                dropOptions: {hoverClass: "dragHover"},
                anchor: "Continuous",
                allowLoopback: true
            });

            // this is not part of the core demo functionality; it is a means for the Toolkit edition's wrapped
            // version of this demo to find out about new nodes being added.
            //
            this.instance.fire("jsPlumbDemoNodeAdded", el);
        //});
    }

    setZoom(scale, el){
        console.log(scale)
        //Round scales to nearest 10th
        scale = Math.round(scale*10)/10;

        el.attr({
            style:
            'zoom: '+scale+';'+
            '-webkit-transform: scale('+scale+');'+
            '-moz-transform: scale('+scale+');'+
            '-o-transform: scale('+scale+');'+
            '-ms-transform: scale('+scale+');'+
            'transform: scale('+scale+');'
        });
    }

    //Helper to get the current scale factor of the stage
    getZoom(el) {

        var curZoom = el.css('zoom');
        var curScale = el.css('transform') ||
            el.css('-webkit-transform') ||
            el.css('-moz-transform') ||
            el.css('-o-transform') ||
            el.css('-ms-transform');

        if (curScale === 'none') {
            curScale = 1;
        } else {
            //Parse retarded matrix string into array of values
            var scaleArray = $.parseJSON(curScale.replace(/^\w+\(/, "[").replace(/\)$/, "]"));

            //We only need one of the two scaling components as we are always scaling evenly across both axes
            curScale = scaleArray[0];
        }

        return {curZoom: curZoom, curScale: curScale};
    }

    repaintEverything(){

    }


}