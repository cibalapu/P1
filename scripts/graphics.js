(function() {

/*------------------------------------------------------------*\
 * graphics.js : Point2D
\*------------------------------------------------------------*/
const RADIAN = Math.PI / 180;
class Point2D {
    constructor(x, y) {
        if (typeof x == "object") {
            if (x instanceof Array) {
                if (x.length>1) { y = x[1]; }
                x = x[0];
            } else {
                if ("y" in x) { y = x["y"]; }
                if ("x" in x) { x = x["x"]; }
            }
        } else {
            x = parseFloat(x);
            y = parseFloat(y);
        }
        if (x===null || x===undefined || isNaN(x)) { x = 0; }
        if (y===null || y===undefined || isNaN(y)) { y = x; }
        this.x = x;
        this.y = y;
        this.system = null;
    };

    clone() { return new Point2D(this.x,this.y); };
    add(x,y) {
        let pt = new Point2D(x,y);
        this.x += pt.x;
        this.y += pt.y;
        return this;
    };
    sub(x,y) {
        let pt = new Point2D(x,y);
        this.x -= pt.x;
        this.y -= pt.y;
        return this;
    }
    mul(x,y) {
        let pt = new Point2D(x,y);
        this.x *= pt.x;
        this.y *= pt.y;
        return this;
    };
    div(x,y) {
        let pt = new Point2D(x,y);
        this.x /= pt.x;
        this.y /= pt.y;
        return this;
    };

    get length() { return Math.sqrt(this.x*this.x+this.y*this.y); };
    static Distance(p1,p2) {
        [p1,p2] = [p1,p2].map(function(pt) {
            if (pt instanceof Point2D) { return pt; }
            return new Point2D(pt);
        });
        let dx = p1.x - p2.x, dy = p1.y - p2.y;
        return Math.sqrt(dx*dx+dy*dy);
    };

    normalize() {
        let d = Math.sqrt(this.x*this.x+this.y*this.y);
        this.x /= d;
        this.y /= d;
        return this;
    };

    get radian() { return Math.atan2(this.y,this.x); };
    get degree() { return this.radian / RADIAN; };

    /*polar(rad,leng) {
        this.x += leng * Math.cos(rad);
        this.y += leng * Math.sin(rad);
        return this;
    };
    static Polar(rad,leng) {
        return new Point2D(0,0).polar(rad,leng);
    };*/
    polar(deg,leng) {
        while (deg<0) { deg += 360; }
        while (deg>=360) { deg -= 360; }
        let rad = deg * RADIAN;
        this.x += leng * Math.cos(rad);
        this.y += leng * Math.sin(rad);
        return this;
    };
    static Polar(deg,leng) {
        return new Point2D(0,0).polar(deg,leng);
    };

    toString() { return "("+this.x+","+this.y+")"; };
};

/*------------------------------------------------------------*\
 * graphics.js : System2D
\*------------------------------------------------------------*/
class System2D {
    constructor(dx,dy) {
        this.axisX = (dx instanceof Point2D)
            ? dx.clone().normalize()
            : new Point2D(1,0);
        this.axisY = (dy instanceof Point2D)
            ? dy.clone().normalize()
            : new Point2D(-dx.y,dx.x).normalize();
        this.radian = Math.atan2(this.axisX.y,this.axisX.x);
    };

    convert(pt) {
        if (!(pt instanceof Point2D)) { throw "Not a Point2D."; }
        let rad = Math.atan2(pt.y,pt.x) - this.radian,
            d = pt.length,
            spt = new Point2D(Math.cos(rad)*d,Math.sin(rad)*d);
        spt.system = this;
        return spt;
    };

    radian(pt) {
        if (!(pt instanceof Point2D)) { throw "Not a Point2D."; }
        let rad = Math.atan2(pt.y,pt.x) - this.radian;
        if (Math.abs(rad)>Math.PI) { rad += Math.PI * ((rad>0)?-2:2); }
        //return (rad / RADIAN);
        return rad;
    };
    degree(pt) {
        if (!(pt instanceof Point2D)) { throw "Not a Point2D."; }
        let rad = Math.atan2(pt.y,pt.x) - this.radian;
        if (Math.abs(rad)>Math.PI) { rad += Math.PI * ((rad>0)?-2:2); }
        return (rad / RADIAN);
    };

    point(x,y) {
        return this.axisX.clone().mul(x).add(
            this.axisY.clone().mul(y));
    };

};

/*------------------------------------------------------------*\
 * graphics.js : Segment2D
\*------------------------------------------------------------*/
class Segment2D {
    constructor(pt1,pt2) {
        this.begin = new Point2D(pt1);
        this.close = new Point2D(pt2);
        this.delta = this.close.clone().sub(this.begin);
        this.cross = this.close.x * this.begin.y - this.begin.x * this.close.y;
    };

    draw(ctx,color,width) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.begin.x,this.begin.y);
        ctx.lineTo(this.close.x,this.close.y);
        ctx.moveTo(this.begin.x,this.begin.y);
        ctx.closePath();
        ctx.lineWidth = isNaN(width) ? 1 : parseFloat(width);
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    };

    collide(pt,dir) {
        let pt2 = pt.clone().add(dir),
            cross = pt2.x*pt.y - pt.x*pt2.y;
        let bot = this.delta.x*dir.y - dir.x*this.delta.y;
        if (bot==0) { return null; };
        let rpt = new Point2D(
                (this.cross * dir.x - cross * this.delta.x) / bot,
                (this.cross * dir.y - cross * this.delta.y) / bot
            ),
            it = rpt.clone().sub(pt);
        let d = Math.abs(it.radian - dir.radian);
        if (d<EPSILON) { return null; }
        if (it.length>dir.length) { return null; }
        return rpt;
    };
}

/*------------------------------------------------------------*\
 * graphics.js : Path2D
\*------------------------------------------------------------*/
const EPSILON = 0.0001;
class Path2D {
    constructor() {
        this.points = [];
    };

    get closed() {
        let max = this.points.length;
        if (max<=0) { return false; }
        return Point2D.Distance(this.points[0],this.points[max-1])<EPSILON;
    };
    clear() {
        this.points = [];
    };
    add(x,y) {
        let index = this.points.length;
        this.points.push(new Point2D(x,y));
        return index;
    };
    insert(i,x,y) {
        if (i<0 || i>=this.points.length) { return; }
        this.points.splice(i,new Point2D(x,y));
    };
    get length() { return this.points.length; };

    interpolate(x) {
        for(let i=1;i<this.points.length;i++) {
            let pt = this.points[i];
            if (pt.x>x) {
                let prev = this.points[i-1],
                    dx = pt.x - prev.x,
                    dy = pt.y - prev.y,
                    tx = x - prev.x,
                    ty = tx/dx*dy + prev.y;
                return ty;
            }
        }
        return null;
    };

    curvize(min=0,divide=4,factor=0.5) {
        let points = [],
            origins = [],
            max = this.points.length,
            cls = this.closed;
        this.points.map((pt,i,pts)=>{
            origins.push(points.length);
            points.push(pt);
            if (i+1>=max) { return; }
            if (Point2D.Distance(pts[i],pts[i+1])<min) { return; }
            Path2D.Middle([
                (i<1) ? cls?pts[max-2]:null : pts[i-1],
                pts[i], pts[i+1],
                (i+2>=max) ? cls?pts[1]:null : pts[i+2]
            ],divide,factor).map((pt)=>{ points.push(pt); });
        });
        this.points = points;
        return origins;
    };

    static Middle([p1,p,n,n1],d=4,f=0.5) {
        let dir = n.clone().sub(p), dis = dir.length,
            sys = new System2D(dir);
        let f0 = (p1==null) ? dir.clone() : p.clone().sub(p1),
            f1 = (n1==null) ? dir.clone().mul(-1) : n.clone().sub(n1);
        let s0 = sys.convert(f0), s1 = sys.convert(f1);
        if (Math.abs(s0.y)<=EPSILON && Math.abs(s1.y)<=EPSILON) {
            return [ dir.clone().mul(0.5).add(p) ];
        }
        if (Math.abs(s0.y)<EPSILON) {
            let deg = sys.degree(f1),
                sup = ((deg>=0)?180:-180) - deg,
                div = (d==1 ? 0 : sup*(d*2-1)/(d*2)) + deg,
                v = Point2D.Polar(div,1);
            if (Math.abs(v.x)<EPSILON) { console.log("Warning!"); };
            v.mul(dis * -0.25 / v.x);
            return [
                dir.clone().mul(0.5).add(p),
                sys.point(v.x,v.y*f).add(n)
            ];
        }
        if (Math.abs(s1.y)<EPSILON) {
            let v = Point2D.Polar(sys.degree(f0)/(d*2),1);
            if (Math.abs(v.x)<EPSILON) { console.log("Warning!"); };
            v.mul(dis * 0.25 / v.x);
            return [
                sys.point(v.x,v.y*f).add(p),
                dir.clone().mul(0.5).add(p)
            ];
        }
        let deg0 = sys.degree(f0),
            deg1 = sys.degree(f1),
            sup1 = ((deg1>=0)?180:-180) - deg1,
            div0 = deg0 / d,
            div1 = (d==1 ? 0 : sup1*(d-1)/d) + deg1;
        let v0 = Point2D.Polar(div0,1),
            v1 = Point2D.Polar(div1,1),
            bf = v0.y / v1.y;
        if (Math.abs(v0.x)<EPSILON) { console.log("Warning!"); };
        if (s0.y*s1.y>EPSILON) {
            v0.mul(dis / (v0.x-v1.x*bf));
            return [ sys.point(v0.x,v0.y * f).add(p) ];
        } else {
            let a = dis / (2*(v0.x+v1.x*bf)), b = -1 * bf * a;
            v0.mul(a);
            v1.mul(b);
            return [
                sys.point(v0.x,v0.y*f).add(p),
                sys.point(v1.x,v1.y*f).add(n)
            ];
        }
        return [];
    };

    line(ctx,color) {
        ctx.beginPath();
        let last;
        this.points.map((pt,i) => {
            last = pt;
            if (i==0) { ctx.moveTo(pt.x,pt.y); }
            else { ctx.lineTo(pt.x,pt.y); }
        });
        ctx.moveTo(last.x,last.y);
        ctx.closePath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
    };

    dot(ctx,radius,color) {
        this.points.map((pt,i) => {
            ctx.beginPath();
            ctx.arc(pt.x,pt.y,radius,0,2*Math.PI);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        });
    };
};

/*------------------------------------------------------------*\
 * graphics.js : GeometricDraw
\*------------------------------------------------------------*/
const RA = Math.PI / 2;
function point_sorting(p1,p2) {
    if (Point2D.Distance(p1,p2)<EPSILON) { return 0; }
    let dx = p1.x - p2.x, dy = p1.y - p2.y;
    return (Math.abs(dx)>Math.abs(dy))
        ? ((dx<0) ? -1 : 1)
        : ((dy<0) ? 1 : -1);
};
let count = 0;
class GD_Line {
    constructor(p1,p2) {
        count++;
        this.name = "L" + count;
        this.p1 = new Point2D(p1);
        this.p2 = new Point2D(p2);
        if (this.p1.x==this.p2.x) {
            this.a = 1;
            this.b = 0;
        } else {
            this.a = (this.p2.y-this.p1.y) / (this.p1.x-this.p2.x);
            this.b = 1;
        }
        this.c = this.a * this.p1.x + this.b * this.p1.y;
    };

    translate(x,y) {
        this.p1.add(x,y);
        this.p2.add(x,y);
        this.c = this.a * this.p1.x + this.b * this.p1.y;
    };

    intersect(gdo) {
        if (gdo instanceof GD_Line) {
            if (this.a==gdo.a && this.b==gdo.b) { return []; }
            if (this.b==0) { return [new Point2D(this.c,gdo.c-gdo.a*this.c)]; }
            if (gdo.b==0) { return [new Point2D(gdo.c,this.c-this.a*gdo.c)]; }
            let x = (this.c-gdo.c) / (this.a-gdo.a),
                y = gdo.c - gdo.a * x;
            return [new Point2D(x,y)];
        }
        if (gdo instanceof GD_Circle) {
            let r2 = gdo.radius * gdo.radius;
            if (this.a==0) {
                let dy = Math.abs(this.c - gdo.center.y);
                if (dy>gdo.radius) { return []; }
                if (dy==gdo.radius) { return [new Point2D(gdo.center.x,this.c)]; }
                let x2 = Math.sqrt(r2-dy*dy);
                return [
                    new Point2D(gdo.center.x+x2,this.c),
                    new Point2D(gdo.center.x-x2,this.c)
                ];
            }
            if (this.b==0) {
                let dx = Math.abs(this.c - gdo.center.x);
                if (dx>gdo.radius) { return []; }
                if (dx==gdo.radius) { return [new Point2D(this.c,gdo.center.y)]; }
                let y2 = Math.sqrt(r2-dx*dx);
                return [
                    new Point2D(this.c,gdo.center.y+y2),
                    new Point2D(this.c,gdo.center.y-y2)
                ];
            }
            let a = -1 / this.a,
                c = a * gdo.center.x + gdo.center.y,
                x = (this.c-c) / (this.a-a),
                y = this.c - this.a * x,
                pt = new Point2D(x,y),
                d = Point2D.Distance(gdo.center,pt);
            if (d>gdo.radius) { return []; }
            if (d==gdo.radius) { return [pt]; }
            let h = Math.sqrt(gdo.radius*gdo.radius-d*d),
                dir = (new Point2D(0,this.c)).sub(pt).normalize().mul(h);
            return [
                pt.clone().add(dir),
                pt.clone().sub(dir)
            ];
        }
    };

    static DrawFunction(x1,y1,x2,y2,pts) {
        let dx = x2 - x1,
            dy = y2 - y1;
        return function(ctx,t=1,base=false) {
            ctx.beginPath();
            ctx.moveTo(x1,y1);
            ctx.lineTo(x1+dx*t,y1+dy*t);
            ctx.moveTo(x1,y1);
            ctx.closePath();
            ctx.stroke();
            if (base===true) {
                pts.map((pt)=>{
                    ctx.beginPath();
                    ctx.arc(pt.x,pt.y,ctx.lineWidth+4,0,2*Math.PI);
                    ctx.closePath();
                    ctx.fill();
                });
            }
            return (t==1);
        };
    };
    drawer(w,h) {
        if (this.a==0) {
            return GD_Line.DrawFunction(
                0,this.c,
                w,this.c,
                [this.p1,this.p2]
            );
        }
        if (this.b==0) {
            return GD_Line.DrawFunction(
                this.c,0,
                this.c,h,
                [this.p1,this.p2]
            );
        }
        let pts = [
            [0,this.c], [w,this.c-this.a*w],
            [this.c/this.a,0], [(this.c-h)/this.a,h]
        ].map(([x,y])=>{
            if (x<0 || x>w || y<0 || y>h) { return null; }
            return new Point2D(x,y);
        });
        pts.sort((pt1,pt2)=>{
            if (pt1==null && pt2!=null) { return 1; }
            if (pt1!=null && pt2==null) { return -1; }
            return 0;
        });
        return GD_Line.DrawFunction(
            pts[0].x,pts[0].y,
            pts[1].x,pts[1].y,
            [this.p1,this.p2]
        );
    };
};

class GD_Circle {
    constructor(cp,rp) {
        count++;
        this.name = "C" + count;
        this.center = new Point2D(cp);
        this.radius = Point2D.Distance(cp,rp);
    };

    intersect(gdo) {
        if (gdo instanceof GD_Line) { return gdo.intersect(this); }
        if (gdo instanceof GD_Circle) {
            let max = this.radius + gdo.radius,
                dir = gdo.center.clone().sub(this.center),
                d = dir.length;
            if (d>max) { return []; }
            if (d==max) { return [dir.normalize().mul(this.radius).add(this.center)]; }
            let deg90 = new Point2D(dir.y,-dir.x),
                r2 = this.radius*this.radius,
                w = (r2 - gdo.radius*gdo.radius + d*d) / (2*d),
                h = Math.sqrt(r2-w*w);
            dir.normalize().mul(w);
            deg90.normalize().mul(h);
            return [
                this.center.clone().add(dir).add(deg90),
                this.center.clone().add(dir).sub(deg90)
            ];
        }
    };

    static DrawFunction(x,y,radius,pts) {
        return function(ctx,t=1,base=false) {
            ctx.beginPath();
            ctx.arc(x,y,radius,0,t*2*Math.PI);
            ctx.moveTo(x+radius,y);
            ctx.closePath();
            ctx.stroke();
            if (base===true) {
                pts.map((pt)=>{
                    ctx.beginPath();
                    ctx.arc(pt.x,pt.y,ctx.lineWidth+4,0,2*Math.PI);
                    ctx.closePath();
                    ctx.fill();
                });
            }
            return (t==1);
        };
    };
    drawer(w,h) {
        return GD_Circle.DrawFunction(this.center.x,this.center.y,this.radius,[this.center]);
    };
};

function def(opt) {
    let op = (typeof opt != "object") ? {} : opt;
    return function(k,dv) { return (k in op) ? op[k] : dv; };
};
class GeometricDraw {
    constructor(options) {
        this.points = [];
        this.steps = [];
        this.before = [];

        let get = def(options);
        this.origin = new Point2D(get("center",[0,0]));
        this.sketchColor = get("sketchColor","rgb(200,200,200)");
        this.sketchWidth = get("sketchWidth",2);
        this.sketchStyle = get("sketchStyle","dashed");
        this.pointColor = get("pointColor","rgba(0,0,255,0.5)");
        this.pointRadius = get("pointRadius",Math.ceil(this.sketchWidth+3));
    };

    add(npt) {
        for(let pt of this.points) {
            let d = Point2D.Distance(pt,npt);
            if (d<EPSILON) { return false; }
        }
        this.points.push(npt);
        return true;
    };

    clear() {
        count = 0;
        this.points = [];
        this.steps = [];
        this.before = [];
        /*let ctx = this.canvas.getContext("2d"),
            w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0,0,w,h);*/
    };

    point(x,y) {
        let pt = new Point2D(x,y).add(this.origin);
        this.add(pt);
        return pt.clone().sub(this.origin);
    };

    line(p1,p2) {
        this.before.push(this.points.length);
        let l = new GD_Line(p1,p2), ret = {};
        l.translate(this.origin);
        this.steps.map((p)=>{
            let pts = l.intersect(p);
            pts.sort(point_sorting);
            pts.map((npt,i)=>{
                if (!this.add(npt)) { return; }
                ret[p.name+l.name+"p"+i] = npt.clone().sub(this.origin);
            });
        });
        this.steps.push(l);
        return ret;
    };

    circle(p1,p2) {
        this.before.push(this.points.length);
        let c = new GD_Circle(p1,p2), ret = {};
        c.center.add(this.origin);
        this.add(c.center);
        this.steps.map((p)=>{
            let pts = c.intersect(p);
            pts.sort(point_sorting);
            pts.map((npt,i)=>{
                if (!this.add(npt)) { return; }
                ret[p.name+c.name+"p"+i] = npt.clone().sub(this.origin);
            });
        });
        this.steps.push(c);
        return ret;
    };


    draw(canvas,index,t) {
        if (!(canvas instanceof HTMLCanvasElement)) { return; }
        let ctx = canvas.getContext("2d"),
            w = canvas.width, h = canvas.height,
            max = this.steps.length;
        ctx.save();
        switch(this.sketchStyle) {
        case "dashed":
            ctx.setLineDash([this.sketchWidth*2+1,this.sketchWidth+1]);
            break;
        default:
            ctx.setLineDash([]);
            break;
        }
        ctx.lineWidth = this.sketchWidth;
        ctx.clearRect(0,0,w,h);
        ctx.strokeStyle = this.sketchColor;
        let d, m = Math.min(max,index);
        for(let i=0;i<m;i++) {
            d = this.steps[i].drawer(w,h);
            d.call(null,ctx,1,false);
        }
        ctx.fillStyle = this.pointColor;
        let b = (m<max) ? this.before[m] : this.points.length;
        for(let i=0;i<b;i++) {
            let pt = this.points[i];
            ctx.beginPath();
            ctx.arc(pt.x,pt.y,this.pointRadius,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
        }
        let next = true;
        if (m<max) {
            ctx.fillStyle = "rgba(255,150,0,1)";
            ctx.strokeStyle = "rgba(255,150,0,0.5)";
            d = this.steps[m].drawer(w,h);
            d.call(null,ctx,t>1?1:t,true);
        } else if (t>=1) { next = false; }
        ctx.restore();
        return next;
    };
};

/*------------------------------------------------------------*\
 * graphics.js : TurtleDraw
\*------------------------------------------------------------*/
class TurtleDraw {
    constructor(x,y) {
        this.position = new Point2D(x,y);
        this.path = [];
    };

    clear() { this.path = []; };
    draw(ctx,color) {
        let cur_pt = this.position.clone();
        ctx.beginPath();
        ctx.moveTo(cur_pt.x,cur_pt.y);
        this.path.map((p,i)=>{
            switch (p.length) {
            case 2: // Line
                cur_pt.polar(p[0],p[1]);
                ctx.lineTo(cur_pt.x,cur_pt.y);
                break;
            case 5: // Arc
                let p0 = cur_pt.clone().polar(p[0],p[1]),
                    p1 = p0.clone().polar(p[2],p[3]),
                    p2 = p0.clone().polar(p[2]+180,p[3]),
                    r = cur_pt.clone().sub(p1).length + cur_pt.clone().sub(p2).length;
                let a = r / 2,
                    cd = p0.clone().sub(p1).length,
                    b = Math.sqrt(Math.pow(r/2,2) - Math.pow(cd,2)),
                    deg0 = cur_pt.clone().sub(p0).degree - p[2];
                let ai = (new Point2D(0,0)).polar(p[2],p[3]).normalize().mul(a),
                    bj = new Point2D(-ai.y,ai.x).normalize().mul(b);
                ctx.moveTo(cur_pt.x,cur_pt.y);
                const seg = 10;
                let f = p[4] / seg;
                for(let i=1;i<=seg;i++) {
                    let rad = (i*f+deg0) * Math.PI / 180;
                    let pt = p0.clone()
                        .add(ai.clone().mul(Math.cos(rad)))
                        .add(bj.clone().mul(Math.sin(rad)));
                    ctx.lineTo(pt.x,pt.y);
                    cur_pt = pt;
                }
                break;
            default:
                break;
            }
        });
        ctx.moveTo(this.position.x,this.position.y);
        ctx.closePath();
    };

    move(deg,d) { this.path.push([deg,d]); };
    arc(deg1,d1,deg2,d2,deg) { this.path.push([deg1,d1,deg2,d2,deg]); };
};

/*------------------------------------------------------------*\
 * graphics.js : Tessellation
\*------------------------------------------------------------*/
class Tile {
    constructor(x,y) {
        this.position = new Point2D(x,y);
        this.lines = [];
        this.rotate = 0;
    };
};

const tessellation_sides = 3;
class Tessellation {
    constructor(radius=10) {
        this.sides = tessellation_sides;
        this.radius = radius;
        this.tiles = [];
        switch(this.sides) {
        case 3:
            for(let i=0;i<6;i++) {
                let t = new Tile(
                    radius * Math.cos(i*Math.PI/3),
                    radius * Math.sin(i*Math.PI/3)
                );
                if (i%2==0) { t.rotate = Math.PI/3; }
                for(let j=0;j<this.sides;j++) { t.lines.push(0); }
                this.tiles.push(t);
            }
            break;
        case 4:
        case 6:
            let inner = (this.sides-2)*Math.PI/this.sides;
            for(let i=0;i<this.sides;i++) {
                let t = new Tile(
                    radius * Math.cos(inner),
                    radius * Math.sin(inner)
                );
                t.rotate = inner / 2;
                for(let j=0;j<this.sides;j++) { t.lines.push(0); }
                this.tiles.push(t);
            }
            break;
        }
    };

    map(callback) { this.tiles.map(callback); };
    draw(ctx,color,center) {
        center = new Point2D(center);
        let radian = 2 * Math.PI / this.sides,
            inner = (this.sides-2) * Math.PI / this.sides,
            radius = Math.cos(inner) * this.radius;

        this.tiles.map((t,ti)=>{
            ctx.beginPath();
            for(let i=0;i<this.sides;i++) {
                let r = i * radian + t.rotate,
                    pt = Point2D.Polar(r/RADIAN,this.radius)
                        .add(t.position).add(center);
                if (i==0) { ctx.moveTo(pt.x,pt.y); }
                else { ctx.lineTo(pt.x,pt.y); }
            }
            ctx.closePath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgb(200,200,200)";
            ctx.stroke();
            t.lines.map((l,i)=>{
                let n = (i+1) % this.sides,
                    r1 = i * radian + t.rotate + inner,
                    r2 = n * radian + t.rotate + inner,
                    p1 = Point2D.Polar(r1/RADIAN,radius).add(t.position).add(center),
                    p2 = Point2D.Polar(r2/RADIAN,radius).add(t.position).add(center),
                    n1 = Point2D.Polar((n*radian+t.rotate)/RADIAN,this.radius)
                        .add(t.position).add(center),
                    cp = p1.clone().add(p2).div(2);
                switch(l) {
                case 1:
                    ctx.beginPath();
                    ctx.moveTo(p1.x,p1.y);
                    ctx.lineTo(p2.x,p2.y);
                    ctx.closePath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    break;
                case 2: // positive inner
                    let c = cp.clone().sub(n1).add(cp),
                        rp2 = p1.clone().sub(c);
                    ctx.beginPath();
                    ctx.moveTo(p1.x,p1.y);
                    ctx.arc(c.x,c.y,rp2.length,rp2.radian,rp2.radian+inner);
                    ctx.moveTo(p2.x,p2.y);
                    ctx.closePath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    break;
                case 3: // positive inner
                    let rp3 = p2.clone().sub(n1);
                    ctx.beginPath();
                    ctx.moveTo(p2.x,p2.y);
                    ctx.arc(n1.x,n1.y,rp3.length,rp3.radian,rp3.radian+inner);
                    ctx.moveTo(p1.x,p1.y);
                    ctx.closePath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    break;
                default:
                    break;
                }
            });
        });
    };
};

window.kjGraphics = {
    "Point": Point2D,
    "Segment": Segment2D,
    "Line": GD_Line,
    "Circle": GD_Circle,
    "Path": Path2D,
    "GeometricDraw": GeometricDraw,
    "TurtleDraw": TurtleDraw,
    "Tess": Tessellation
};

})();