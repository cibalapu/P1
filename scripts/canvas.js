(function() {

function wrap(o,f,d) { return function() { f.apply(o,d); }; }

var Canvas = function(id,s = 1) {
    this.element = document.querySelector(id);
    this.context = this.element.getContext("2d");
    this.scale = s;
    this.resize();
    this.clear();
    window.addEventListener("resize",wrap(this,()=>{this.resize();},[]));
};
Canvas.prototype.resize = function(w,h) {
    if (w==null || h==null) {
        let p = this.element.parentNode;
        w = p.offsetWidth;
        h = p.offsetHeight;
    }
    this.element.style.width = w + "px";
    this.element.style.height = h + "px";
    this.element.width = w * this.scale;
    this.element.height = h * this.scale;
    this.width = this.element.width;
    this.height = this.element.height;
};
Canvas.prototype.clear = function() {
    this.context.clearRect(0,0,this.width,this.height);
};
Canvas.prototype.draw = function(points,brush,color) {
    /*if (typeof color != "function") {
        var c_str = color;
        color = function(i) { return c_str; };
    }*/
    if (typeof brush != "function") {
        brush = function(pt,i) {
            this.context.lineTo(pt.x,pt.y);
        };
    }
    let that = this, m = points.length - 1;
    this.context.beginPath();
    this.context.moveTo(points[0].x,points[0].y);
    points.map(function(pt,i) {
        brush.call(that,pt,i);
    });
    this.context.moveTo(points[m].x,points[m].y);
    this.context.closePath();

    this.context.lineWidth = 1;
    this.context.strokeStyle = color;
    this.context.stroke();
};


window.kjDemo = {};
window.kjDemo.Canvas = Canvas;

})();