﻿aQuery.define( "ui/draggable", [
  "base/support",
  "module/Widget",
  "main/event",
  "main/css",
  "main/position",
  "main/dom",
  "module/FX",
  "module/animate",
  "html5/animate.transform",
  "html5/css3.transition.animate",
  "html5/css3",
  "main/query",
  "module/tween.extend" ], function( $,
  support,
  Widget,
  event,
  css,
  position,
  dom,
  FX,
  animate,
  animateTransform,
  css3Transition,
  cls3,
  query,
  tween,
  undefined ) {
  "use strict"; //启用严格模式
  var isTransform3d = !! $.config.module.transitionToAnimation && support.transform3d;
  var eventFuns = event.event.document,
    draggable = Widget.extend( "ui.draggable", {
      container: null,
      create: function( ) {
        // var self = this;

        this.container.css( "overflow", "hidden" );

        this.target.css( "position", "absolute" );

        this._initHandler( );

        this.initPositionParent( );

        this.enable( );

        return this;
      },
      customEventName: [ "start", "move", "stop", "pause", "revert" ],
      event: function( ) {},
      enable: function( ) {
        var fun = this.event;
        this.disable( );
        $( "body" ).on( "mouseup", fun );
        this.container.on( "mousemove mouseup", fun );
        this.target.on( "mousedown", fun );
        this.options.disabled = true;
        return this;
      },
      disable: function( ) {
        var fun = this.event;
        $( "body" ).off( "mouseup", fun );
        this.container.off( "mousemove mouseup", fun );
        this.target.off( "mousedown", fun );
        this.options.disabled = false;
        return this;
      },
      init: function( opt, target ) {
        this._super( opt, target );
        this.container = $( this.options.container || document.body );
        return this.create( ).render( );
      },
      initPositionParent: function( ) {
        var result;
        if ( isTransform3d ) {
          this.container.initTransform3d( );
          if ( this.options.container ) {
            this.positionParent = this.container;
          } else {
            this.positionParent = this.target.parent( );
          }
        } else {
          this.target.parents( ).each( function( ele ) {
            switch ( $.style( ele, "position" ) ) {
              case "absolute":
              case "relative":
                result = ele;
                return false;
            }
          } );
          if ( !result ) {
            result = document.body;
            $.css( result, "position", "relative" );
          }
          //self.container = $(result);
          this.positionParent = $( result );
          this._setOverflow( );
        }

        return this;
      },
      _setOverflow: function( overflow ) {
        if ( overflow !== undefined ) {
          this.options.overflow = overflow;
        }
        if ( this.positionParent ) {
          if ( this.options.overflow == true ) {
            this.positionParent.css( {
              "overflow": "hidden"
            } );
          } else {
            this.positionParent.css( "overflow", "" );
          }
        }
      },
      _setContainer: function( container ) {
        if ( this.options.container == null ) {
          this.options.container = container;
        }
      },
      options: {
        container: null,
        disabled: true,
        x: 0,
        y: 0,
        originX: 0,
        originY: 0,
        diffx: 0,
        diffy: 0,
        axis: null,
        axisx: true,
        axisy: true,
        cursor: "default",
        overflow: false,
        keepinner: true,
        innerWidth: 0,
        innerHeight: 0,
        outerWidth: 0,
        outerHeight: 0,
        isEase: false,
        stopPropagation: true,
        pauseSensitivity: 500,
        revert: false,
        revertDuration: FX.normal,
        revertEasing: tween.expo.easeOut
      },
      setter: {
        x: 0,
        y: 0,
        originX: 0,
        originY: 0,
        diffx: 0,
        diffy: 0,
        axisx: 0,
        axisy: 0,
        cursor: 0
      },
      publics: {
        getPositionX: Widget.AllowReturn,
        getPositionY: Widget.AllowReturn,
        render: Widget.AllowPublic
      },
      getPositionX: function( ) {
        return this.target.getLeft( ) + ( isTransform3d ? this.target.transform3d( "translateX", true ) : 0 );
      },
      getPositionY: function( ) {
        return this.target.getTop( ) + ( isTransform3d ? this.target.transform3d( "translateY", true ) : 0 );
      },
      _initHandler: function( ) {
        var self = this,
          target = self.target,
          opt = self.options,
          timeout,
          parentLeft = null,
          parentTop = null,
          dragging = null;
        this.event = function( e ) {
          var offsetLeft, offsetTop, x, y, para = {};
          if ( e.type !== "mousemove" || dragging ) {
            offsetLeft = self.getPositionX( );
            offsetTop = self.getPositionY( );
            x = e.pageX || e.clientX;
            y = e.pageY || e.clientY;
            para = {
              type: self.getEventName( "start" ),
              container: self.container,
              clientX: x,
              clientY: y,
              offsetX: e.offsetX || e.layerX || x - offsetLeft,
              offsetY: e.offsetY || e.layerY || y - offsetTop,
              originX: null,
              originY: null,
              event: e,
              target: this
            };
          }
          switch ( e.type ) {
            case "touchstart":
            case "mousedown":
              dragging = target;
              opt.diffx = x - offsetLeft;
              opt.diffy = y - offsetTop;
              parentLeft = self.positionParent.getLeft( );
              parentTop = self.positionParent.getTop( );
              para.originX = opt.originX = x - opt.diffx - parentLeft;
              para.originY = opt.originY = y - opt.diffy - parentTop;

              if ( opt.disabled == false ) {
                opt.cursor = "default";
              } else {
                switch ( opt.axis ) {
                  case "x":
                    opt.axisy = false;
                    opt.cursor = "e-resize";
                    break;
                  case "y":
                    opt.axisx = false;
                    opt.cursor = "n-resize";
                    break;
                  default:
                    opt.axisx = true;
                    opt.axisy = true;
                    opt.cursor = "move";
                }
              }
              self.target.css( {
                cursor: opt.cursor
              } );

              eventFuns.preventDefault( e );
              opt.stopPropagation && eventFuns.stopPropagation( e );
              target.trigger( para.type, target[ 0 ], para );
              break;
            case "touchmove":
            case "mousemove":
              if ( dragging !== null ) {
                x -= ( opt.diffx + parentLeft );
                y -= ( opt.diffy + parentTop );

                self.render( x, y, parentLeft, parentTop );

                eventFuns.preventDefault( e );
                para.type = self.getEventName( "move" );
                para.offsetX = opt.x;
                para.offsetY = opt.y;
                para.originX = opt.originX;
                para.originY = opt.originY;
                target.trigger( para.type, target[ 0 ], para );

                clearTimeout( timeout );
                timeout = setTimeout( function( ) {
                  para.type = self.getEventName( "pause" );
                  target.trigger( para.type, target[ 0 ], para );
                }, opt.pauseSensitivity );
              }
              break;
            case "touchend":
            case "mouseup":
              clearTimeout( timeout );
              eventFuns.preventDefault( e );
              opt.stopPropagation && eventFuns.stopPropagation( e );
              para.type = self.getEventName( "stop" );
              para.offsetX = opt.x;
              para.offsetY = opt.y;
              para.originX = opt.originX;
              para.originY = opt.originY;
              dragging = null;
              var animateOpt = {};

              self.target.css( {
                cursor: "pointer"
              } );
              target.trigger( para.type, target[ 0 ], para );

              if ( opt.revert ) {
                if ( isTransform3d ) {
                  animateOpt = {
                    transform3d: {
                      translateX: opt.originX + "px",
                      translateY: opt.originY + "px"
                    }
                  };
                } else {
                  animateOpt = {
                    left: opt.originX + "px",
                    top: opt.originY + "px"
                  };
                }

                target.animate( animateOpt, {
                  duration: opt.revertDuration,
                  easing: opt.revertEasing,
                  complete: function( ) {
                    para.type = "revert";
                    target.trigger( para.type, target[ 0 ], para );
                  }
                } );
              }
              break;
          }
        };

      },
      render: function( x, y, parentLeft, parentTop ) {
        var
        opt = this.options,
          con = this.container,
          cP;

        parentLeft = parentLeft || this.positionParent.getLeft( );
        parentTop = parentTop || this.positionParent.getTop( );

        if ( opt.keepinner == true && con[ 0 ] ) {
          cP = con.position( );
          cP.pageLeft -= parentLeft;
          cP.pageTop -= parentTop;

          var diffWidth = cP.width - this.target.width( );
          var diffHeight = cP.height - this.target.height( );

          var boundaryWidth = diffWidth > 0 ? opt.outerWidth : opt.innerWidth;
          var boundaryHeight = diffHeight > 0 ? opt.outerHeight : opt.innerHeight;

          x = $.among( cP.pageLeft + boundaryWidth, diffWidth + cP.pageLeft - boundaryWidth, x );
          y = $.among( cP.pageTop + boundaryHeight, diffHeight + cP.pageTop - boundaryHeight, y );

        }

        opt.x = x;
        opt.y = y;

        return isTransform3d ? this._renderByTransform3d( x, y ) : this._render( x, y );
      },
      _render: function( x, y ) {
        var opt = this.options;

        if ( opt.axisx === true && x != undefined ) {
          this.target.css( "left", x + "px" );
        }
        if ( opt.axisy === true && y != undefined ) {
          this.target.css( "top", y + "px" );
        }

        return this;
      },
      _renderByTransform3d: function( x, y ) {
        var opt = this.options,
          obj = {};

        if ( opt.axisx === true && x != undefined ) {
          obj.tx = x;
        }
        if ( opt.axisy === true && y != undefined ) {
          obj.ty = y;
        }
        this.target.setTranslate3d( obj );
        return this;
      },
      target: null,
      toString: function( ) {
        return "ui.draggable";
      },
      widgetEventPrefix: "drag"
    } );

  //提供注释
  $.fn.uiDraggable = function( a, b, c, args ) {
    /// <summary>使对象的第一元素可以拖动
    /// <para>bol obj.disabled:事件是否可用</para>
    /// <para>num obj.axis:"x"表示横轴移动;"y"表示纵轴移动;缺省或其他值为2轴</para>
    /// <para>num obj.second:秒数</para>
    /// <para>fun obj.dragstar:拖动开始</para>
    /// <para>fun obj.dragmove:拖动时</para>
    /// <para>fun obj.dragstop:拖动结束</para>
    /// </summary>
    /// <param name="a" type="Object/String">初始化obj或属性名:option或方法名</param>
    /// <param name="b" type="String/null">属性option子属性名</param>
    /// <param name="c" type="any">属性option子属性名的值</param>
    /// <param name="args" type="any">在调用方法的时候，后面是方法的参数</param>
    /// <returns type="$" />
    return draggable.apply( this, arguments );
  };

  return draggable;

} );