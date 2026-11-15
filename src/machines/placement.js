/* Placement: original geometry ported to r147; independent SMEMA lane processes. */
'use strict';
SMT3D.register('placement',function(C,opts={}){
const machine=new THREE.Group();machine.position.x=opts.x||0;C.parentFor(opts).add(machine);
const Zn=C.KIT, Cn=machine;
const {Group:We,Vector3:R,CanvasTexture:us,MeshStandardMaterial:gn,Mesh:se,BoxGeometry:Nn,CylinderGeometry:Hn,InstancedMesh:Fi,Object3D:ae,Color:bt,PlaneGeometry:Tn,Matrix4:Yt,ExtrudeGeometry:Ws,Shape:ri,MeshBasicMaterial:pn,Line:Ln,BufferGeometry:Zt,LineBasicMaterial:He}=THREE;
const wn=THREE.DoubleSide,ke=THREE.sRGBEncoding,os=THREE.RepeatWrapping;
var Ec = window.SMT,
  pe = s => document.getElementById(s),
  lr = s => getComputedStyle(document.documentElement).getPropertyValue(s).trim(),
  Yi = (s, t, e) => Math.min(e, Math.max(t, s)),
  ur = (s, t, e) => s + (t - s) * e,
  _s = s => s * s * s * (10 + s * (6 * s - 15));
var ys = {
    deck: .8,
    pcb: .9016,
    rest: .946,
    tape: .9003
  },
  Fn = {
    feed: .47,
    cam: .34
  },
  Tc = [-.17, .17],
  Fe = {
    L: .25,
    W: .2,
    T: .0016,
    xQ: -1.5,
    xIn: -1,
    xOut: 1,
    xGone: 1.5,
    tMove: 1.4,
    tClamp: .25
  },
  _p = {
    pick: .07,
    place: .08,
    scan: .24
  },
  vs = 16,
  zo = Array.from({
    length: vs
  }, (s, t) => [(t % 8 - 3.5) * .018, (Math.floor(t / 8) - .5) * .022]),
  vc = [{
    id: "f",
    name: "Head F",
    side: -1
  }, {
    id: "r",
    name: "Head R",
    side: 1
  }];

function od(s, t, e, n = {}) {
  let i = document.createElement("canvas");
  i.width = s, i.height = t, e(i.getContext("2d"), s, t);
  let r = new us(i);
  return r.encoding = ke, r.anisotropy = 8, n.repeat && (r.wrapS = r.wrapT = os), r
}
var
  Xg = {
    chip: "#8a7a62",
    led: "#42c86a",
    ic: "#3b4250",
    ecap: "#b8c0c8",
    tant: "#d9a12a",
    conn: "#15171a"
  },
  Fg = {
    chip: "Chip R / C",
    led: "LED",
    ic: "IC / BGA / QFP",
    ecap: "Electrolytic",
    tant: "Tantalum",
    conn: "Connector"
  },
  Tp = [...new Set(Zn.places.map(s => s.key))].map(s => {
    let t = Zn.places.find(e => e.key === s);
    return {
      key: s,
      sample: t,
      w: Math.max(t.info.w, t.info.d) / 1e3
    }
  }).sort((s, t) => s.w - t.w),
  cr = {
    pitch: .0175,
    cart: .275,
    bw: .013
  },
  qg = (s, t) => s * cr.cart + (t - 14.5) * cr.pitch,
  Og = s => qg(s < 30 ? -1 : 1, s % 30);
{
  let s = 1;
  for (let t of Tp) {
    let e = Math.max(1, Math.ceil(t.w / cr.pitch));
    t.slot = s + (e - 1) / 2, s += e, s >= 30 && s - e < 30 && (s = 31, t.slot = s + (e - 1) / 2, s += e)
  }
}
var _1 = Object.fromEntries(Tp.map((s, t) => [s.key, t])),
  Yg = [-1, 1].map(s => Tp.map(t => {
    let e = Math.floor(t.slot),
      n = t.slot - e;
    return {
      x: ur(Og(e), Og(Math.min(59, e + 1)), n),
      y: s * Fn.feed,
      z: ys.tape,
      key: t.key,
      sample: t.sample,
      w: t.sample.info.w / 1e3,
      d: t.sample.info.d / 1e3,
      name: (s < 0 ? "F" : "R") + String(Math.round(t.slot) + 1).padStart(2, "0")
    }
  })),
  dr = Zn.places.map(s => {
    let t = Math.abs(Math.sin(s.rot)) > .5,
      e = s.info.w / 1e3,
      n = s.info.d / 1e3;
    return {
      place: s,
      key: s.key,
      kind: s.info.kind,
      u: s.x / 1e3,
      v: -s.z / 1e3,
      rot: s.rot,
      hw: (t ? n : e) / 2,
      hh: (t ? e : n) / 2,
      h: s.info.h / 1e3
    }
  }).sort((s, t) => s.hw * s.hh - t.hw * t.hh || s.u - t.u);
dr.forEach((s, t) => {
  s.trip = Math.floor(t / vs), s.k = t % vs
});

const allJob=dr.slice(),job=opts.job||[0,1];
const jobStart=Math.max(0,Math.min(1,job[0])),jobEnd=Math.max(jobStart,Math.min(1,job[1]));
const start=Math.floor(allJob.length*jobStart),end=Math.floor(allJob.length*jobEnd);
dr=allJob.slice(start,end);dr.forEach((p,i)=>{p.trip=Math.floor(i/16);p.k=i%16;});
// Program planning runs once, before any board arrives. Rare oversized packages use spaced sockets.
const program=planProgram(),Mc=program.trips.length,Ho=[],hr=[[],[]];
function planProgram(){
  const kinds=['small','medium','large'],groups=kinds.map(k=>dr.filter(p=>nozzleClass(p)===k).sort((a,b)=>a.u-b.u));
  let allocation=[16,0,0],score=Infinity;
  for(let a=0;a<=16;a++)for(let b=0;b<=16-a;b++){
    const counts=[a,b,16-a-b];
    const trips=Math.max(...counts.map((n,i)=>groups[i].length?(n?Math.ceil(groups[i].length/n):Infinity):0));
    const waste=counts.reduce((v,n,i)=>v+Math.abs(n/16-groups[i].length/Math.max(1,dr.length)),0);
    if(trips+waste*.01<score){score=trips+waste*.01;allocation=counts;}
  }
  const resident=allocation.flatMap((n,i)=>Array(n).fill(kinds[i])),trips=[];
  const queues=groups.map(g=>g.slice());
  while(queues.some(g=>g.length)){
    const parts=[];resident.forEach((cl,k)=>{const job=queues[kinds.indexOf(cl)].shift();if(job)parts.push({...job,job,k,trip:trips.length});});
    trips.push(parts);
  }
  const sockets=[0,2,4,6,9,11,13,15],special=dr.filter(p=>nozzleClass(p)==='special').sort((a,b)=>a.u-b.u);
  const specialStart=trips.length;
  for(let i=0;i<special.length;i+=sockets.length)trips.push(special.slice(i,i+8).map((job,k)=>({...job,job,k:sockets[k],trip:trips.length})));
  return {resident,allocation,trips,specialStart,specialSockets:sockets.slice(0,Math.min(8,special.length))};
}
var Oe = new We;
Oe.rotation.x = -Math.PI / 2;
Oe.scale.setScalar(1e3);
Cn.add(Oe);
var xs = (s, t, e) => new R(s * 1e3, e * 1e3, -t * 1e3);
var de = (s, t = {}) => new gn({
    color: s,
    envMapIntensity: .45, roughness: .55,
    metalness: 0,
    ...t
  }),
  ct = {
    floor: de(12171187, {
      roughness: .9
    }),
    white: de(14935527, {
      roughness: .42
    }),
    inner: de(2764082, {
      roughness: .55,
      metalness: .2
    }),
    dark: de(3356477, {
      roughness: .6
    }),
    black: de(1184534, {
      roughness: .7
    }),
    grey: de(10133928, {
      roughness: .5
    }),
    steel: de(13028047, {
      roughness: .28,
      metalness: .9
    }),
    alu: de(14014684, {
      roughness: .4,
      metalness: .7
    }),
    blue: de(677796, {
      roughness: .4
    }),
    yellow: de(15909632, {
      roughness: .5
    }),
    red: de(13115420, {
      roughness: .45
    }),
    green: de(2071110, {
      roughness: .45
    }),
    beam: de(1908772, {
      roughness: .45,
      metalness: .35
    }),
    magnet: de(3817029, {
      roughness: .3,
      metalness: .7
    }),
    headCover: de(14672355, {
      roughness: .4
    }),
    feeder: de(13225426, {
      roughness: .4,
      metalness: .55
    }),
    feederCap: de(1842722, {
      roughness: .5
    }),
    reel: de(16053489, {
      roughness: .6
    }),
    tapeW: de(15328470, {
      roughness: .8
    }),
    tapeB: de(1842464, {
      roughness: .6
    }),
    pocket: de(789518, {
      roughness: .9
    }),
    pcbEdge: de(805415, {
      roughness: .6
    }),
    pad: de(13482886, {
      roughness: .35,
      metalness: .8,
      polygonOffset: !0,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3
    }),
    term: de(13948890, {
      roughness: .3,
      metalness: .85
    }),
    ic: de(1710878, {
      roughness: .45
    }),
    rubber: de(1579291, {
      roughness: .85
    }),
    coverWhite: de(15132906, {
      roughness: .4,
      side: wn
    }),
    coverBlack: de(1513756, {
      roughness: .45
    }),
    coverGlass: de(725013, {
      roughness: .06,
      metalness: .2,
      transparent: !0,
      opacity: .5,
      depthWrite: !1,
      side: wn
    }),
    lampR: de(5903634, {
      emissive: 16722462,
      emissiveIntensity: 0
    }),
    lampY: de(5917200, {
      emissive: 16761374,
      emissiveIntensity: 0
    }),
    lampG: de(1002012, {
      emissive: 2482266,
      emissiveIntensity: 0
    }),
    camGlass: [0, 1].map(() => de(658448, {
      roughness: .1,
      emissive: 12575999,
      emissiveIntensity: .05
    }))
  },
  Wo = new Nn(1, 1, 1);

function fr(s, t, e = Oe, n = !0) {
  let i = new se(s, t);
  return i.castShadow = i.receiveShadow = n, e.add(i), i
}

function Ht(s, t, e, n, i, r, o, a, l) {
  let c = fr(Wo, n, a, l);
  return c.scale.set(s, t, e), c.position.set(i, r, o), c
}

function On(s, t, e, n, i, r, o, a = 24, l) {
  let c = new Hn(s, s, t, a);
  c.rotateX(Math.PI / 2);
  let h = fr(c, e, o, l);
  return h.position.set(n, i, r), h
}

function Mp(s, t, e, n, i, r, o, a = 24) {
  let l = new Hn(s, s, t, a);
  l.rotateZ(Math.PI / 2);
  let c = fr(l, e, o);
  return c.position.set(n, i, r), c
}

function td(s, t, e, n, i, r, o, a = 24) {
  let l = fr(new Hn(s, s, t, a), e, o, !1);
  return l.position.set(n, i, r), l
}

function pr(s, t, e, n = Oe, i = !0) {
  let r = new Fi(s, t, e.length),
    o = new ae,
    a = new bt;
  return e.forEach((l, c) => {
    o.position.set(l.p[0], l.p[1], l.p[2]), o.scale.set(...l.s || [1, 1, 1]), o.rotation.set(0, 0, l.r || 0), o.updateMatrix(), r.setMatrixAt(c, o.matrix), l.c !==
      void 0 && r.setColorAt(c, a.set(l.c))
  }), r.castShadow = r.receiveShadow = i, n.add(r), r
}

function M1(s, t, e, n = {}) {
  let i = document.createElement("canvas");
  i.width = 1024, i.height = Math.round(1024 * e / t);
  let r = i.getContext("2d");
  r.fillStyle = n.bg || "#17191c", r.fillRect(0, 0, i.width, i.height), r.fillStyle = n.fg || "#fff", r.font =
    `700 ${Math.round(i.height*.62)}px "Segoe UI", Arial, sans-serif`, r.textAlign = "center", r.textBaseline = "middle", r.fillText(s, i.width / 2, i.height * .54);
  let o = new us(i);
  o.encoding = ke, o.anisotropy = 8;
  let a = new se(new Tn(t, e), new gn({
    map: o,
    roughness: .45
  }));
  return a.rotation.x = Math.PI / 2, a
}
var S1 = new Yt().makeBasis(new R(0, 1, 0), new R(0, 0, 1), new R(1, 0, 0));

function Sp(s, t, e, n, i) {
  let r = new Ws(s, {
    depth: t,
    bevelEnabled: !1,
    curveSegments: 20
  });
  r.applyMatrix4(S1);
  let o = fr(r, e, i);
  return o.position.x = n - t / 2, o
}
Ht(1.18, .88, .7, ct.inner, 0, 0, .45);
for (let s of [-1, 1])
  for (let t of [-1, 1]) On(.035, .1, ct.dark, s * .52, t * .38, .05), On(.055, .015, ct.steel, s * .52, t * .38, .0075);
Ht(1.18, .86, .004, ct.black, 0, 0, .802);
for (let s of [-1, 1]) {
  Ht(.012, .88, .78, ct.white, s * .645, 0, .47);
  for (let t of [-1, 1]) Ht(.05, .42, 1.02, ct.inner, s * .615, t * .51, .61);
  Ht(.05, .6, .76, ct.inner, s * .615, 0, .48), Ht(.05, .6, .12, ct.inner, s * .615, 0, 1.06), Ht(.035, 1.44, .02, ct.magnet, s * .615, 0, 1.13), Ht(.008, 1.44, .012, ct
    .steel, s * .598, 0, 1.146)
}
for (let s of [0, 1]) {
  let t = vc[s].side;
  Ht(.07, .13, .085, ct.dark, 0, t * Fn.cam, .8445), Ht(.014, .1, .002, ct.camGlass[s], 0, t * Fn.cam, .888, Oe, !1), Ht(.13, .05, .03, ct.steel, -.24, t * Fn.cam, .819);
  for (let e = 0; e < 6; e++) On(.005, .004, ct.black, -.29 + e * .02, t * Fn.cam, .8345, Oe, 12, !1);
  Ht(.1, .07, .05, ct.dark, .26, t * Fn.cam, .829), Ht(.08, .05, .002, ct.black, .26, t * Fn.cam, .855, Oe, !1)
}
var $g = [],
  jg = [],
  Qg = [],
  t_ = [],
  e_ = [],
  n_ = [],
  i_ = [];
for (let s of [-1, 1])
  for (let t of [-1, 1]) {
    let e = t * cr.cart;
    for (let n = 0; n < 30; n++) {
      let i = qg(t, n);
      $g.push({
        p: [i, s * .72, .845],
        s: [cr.bw, .56, .11]
      }), jg.push({
        p: [i, s * .965, .925],
        s: [cr.bw, .07, .05]
      });
      let r = s * (n % 2 ? .985 : .82),
        o = n % 2 ? .58 : .66;
      Qg.push({
        p: [i, r, o],
        s: [.01, 1, 1],
        c: n % 7 === 3 ? 11127790 : 16053489
      }), t_.push({
        p: [i, r, o],
        s: [.012, .33, .33]
      }), e_.push({
        p: [i, s * .53, .9001],
        s: [.008, .14, 4e-4]
      }), n_.push({
        p: [i, s * .56, .9012],
        s: [cr.bw * .92, .1, .002]
      });
      for (let a = 0; a < 5; a++) i_.push({
        p: [i - .0052, s * (.462 + a * .004), .90035],
        s: [9e-4, 9e-4, 1e-4]
      })
    }
    Ht(.54, .62, .04, ct.dark, e, s * .84, .16), Ht(.54, .02, .05, ct.dark, e, s * .56, .765);
    for (let n of [-1, 1]) {
      for (let i of [.56, 1.12]) Ht(.02, .02, .62, ct.steel, e + n * .262, s * i, .47), Mp(.04, .03, ct.rubber, e + n * .23, s * (i < 1 ? .6 : 1.08), .04);
      Ht(.02, .58, .02, ct.steel, e + n * .262, s * .84, .77), Ht(.02, .58, .02, ct.steel, e + n * .262, s * .84, .44), Ht(.02, .06, .02, ct.dark, e + n * .25, s * 1.14,
        .8)
    }
    Mp(.012, .52, ct.steel, e, s * 1.155, .8)
  }
pr(Wo, ct.feeder, $g);
pr(Wo, ct.feederCap, jg);
var wp = new Hn(.09, .09, 1, 32);
wp.rotateZ(Math.PI / 2);
pr(wp, ct.reel, Qg);
pr(wp, ct.dark, t_, Oe, !1);
pr(Wo, ct.tapeW, e_, Oe, !1);
pr(Wo, ct.steel, n_, Oe, !1);
// Animated sprocket-hole indices replace the former static pocket strip.
const monitors=[],boardVisionMats=[0,1].map(()=>de(0xd9f4ff,{emissive:0x90ddff,emissiveIntensity:.05}));
var sd = vc.map((s, t) => {
    let e = s.side,
      n = new We,
      i = new We;
    Oe.add(n, i), Ht(1.19, .1, .13, ct.beam, 0, e * .115, 1.235, n), Ht(1.1, .006, .016, ct.steel, 0, e * .063, 1.275, n), Ht(1.1, .006, .016, ct.steel, 0, e * .063,
      1.195, n), Ht(1.1, .004, .04, ct.magnet, 0, e * .064, 1.235, n), Ht(1.1, .102, .012, ct.yellow, 0, e * .115, 1.302, n, !1);
    for (let l of [-1, 1]) Ht(.07, .16, .05, ct.dark, l * .615, e * .115, 1.165, n);
    Ht(1, .05, .02, ct.black, 0, e * .135, 1.318, n), Ht(.16, .1, .2, ct.inner, 0, e * .01, 1.18, i), Ht(.164, .104, .03, ct.headCover, 0, e * .01, 1.295, i), Ht(.06,
      .004, .035, ct.yellow, .03, -e * .041, 1.22, i, !1), Ht(.12, .004, .07, ct.black, 0, -e * .041, 1.14, i, !1), Ht(.16, .07, .05, ct.dark, 0, 0, 1.055, i), On(
      .012, .06, ct.black, -.094, 0, 1.06, i), On(.009, .004, boardVisionMats[t], -.094, 0, 1.028, i, 16, !1);
    let r = zo.map(([l, c]) => {
        let h = new We;
        h.position.set(l, c, ys.rest), i.add(h), On(.0032, .125, ct.steel, 0, 0, .0775, h, 12), On(.0046, .012, ct.dark, 0, 0, .021, h, 12);
        let d = new Hn(.0022, 7e-4, .015, 12);
        return d.rotateX(Math.PI / 2), fr(d, ct.black, h).position.z = .0075, h
      }),
      o = new Ln(new Zt, new He({
        transparent: !0,
        opacity: .8
      }));
    o.position.z = 1, Oe.add(o);
    let a = Array.from({
      length: Mc
    }, (l, c) => {
      let h = [];
      for (let d of hr[t]) d.trip === c && d.kind !== "wait" && (h.length || h.push(new R(d.a[0], d.a[1], 0)), h.push(new R(d.b[0], d.b[1], 0)));
      return h
    });
    return {
      beam: n,
      g: i,
      noz: r,
      path: o,
      trips: a,
      shown: -1
    }
  }),
  Xo = new We;
Oe.add(Xo);
var o_ = [],
  Zi = [],
  Yn = s => (o_.push(s), s),
  le = .26,
  Qe = .5,
  di = 1.44;
for (let s of [-1, 1]) {
  let t = new ri;
  t.moveTo(-(Qe + le), .86), t.lineTo(-(Qe + le), di - le), t.absarc(-Qe, di - le, le, Math.PI, Math.PI / 2, !0), t.lineTo(Qe, di), t.absarc(Qe, di - le, le, Math.PI / 2,
    0, !0), t.lineTo(Qe + le, .86), t.lineTo(.3, .86), t.lineTo(.3, .99), t.lineTo(-.3, .99), t.lineTo(-.3, .86), t.closePath(), Yn(Sp(t, .012, ct.coverWhite, s * .645,
    Xo))
}
Yn(Ht(1.302, Qe * 2, .012, ct.coverWhite, 0, 0, di - .006, Xo));

function R1(s, t = 18) {
  let e = new Tn(s, 1, 1, t),
    n = e.attributes.position;
  for (let i = 0; i < n.count; i++) {
    let r = (.5 - n.getY(i)) * Math.PI / 2;
    n.setY(i, -le * Math.sin(r)), n.setZ(i, -le + le * Math.cos(r))
  }
  return e.computeVertexNormals(), e
}
var kg = () => {
    let s = new ri;
    return s.moveTo(-Qe, di), s.lineTo(-(Qe + le), di), s.lineTo(-(Qe + le), di - le), s.absarc(-Qe, di - le, le, Math.PI, Math.PI / 2, !0), s.closePath(), s
  },
  J1 = [0, 1].map(s => {
    let t = new We;
    t.rotation.z = s * Math.PI, Xo.add(t);
    let e = new We;
    e.position.set(-.15, -Qe, di), t.add(e);
    let n = Yn(fr(R1(.9), ct.coverGlass, e, !1)),
      i = Yn(Ht(.9, .014, .14, ct.coverBlack, 0, -le, -le - .07, e)),
      r = [Yn(Ht(.9, .02, .014, ct.coverWhite, 0, -.008, -.004, e)), Yn(Ht(.018, .016, .14, ct.coverWhite, -.445, -le, -le - .07, e)), Yn(Ht(.018, .016, .14, ct
        .coverWhite, .445, -le, -le - .07, e))],
      o = Mp(.01, .36, ct.steel, 0, -le - .03, -le - .105, e);
    for (let f of [-.17, .17]) Ht(.016, .03, .016, ct.steel, f, -le - .016, -le - .105, e);
    let a = M1("PLACEMENT", .4, .075, {
      bg: "#1e6fd9"
    });
    a.position.set(-.2, -le - .0075, -le - .07), e.add(a), Zi.push({
      g: e,
      open: !1,
      a: 0,
      pick: [n, i, o, ...r]
    }), Yn(Ht(.345, .05, .44, ct.coverWhite, .4725, -(Qe + le) - .025, 1.22, t)), Yn(Ht(.345, le + .05, .012, ct.coverWhite, .4725, -Qe - (le + .05) / 2, di - .006,
      t)), Yn(Sp(kg(), .012, ct.coverWhite, .306, t)), Yn(Sp(kg(), .012, ct.coverWhite, .639, t));
    for (let f of [-1, 1]) Yn(Ht(.075, .34, .92, ct.coverWhite, f * .6075, -.61, .54, t));
    Ht(.27, .03, .21, ct.white, .47, -(Qe + le) - .065, 1.31, t);
    let l = document.createElement("canvas");
    l.width = 640, l.height = 480;
    let c = l.getContext("2d");
    c.fillStyle = "#0d1722", c.fillRect(0, 0, 640, 480), c.fillStyle = "#1e6fd9", c.fillRect(0, 0, 640, 56), c.fillStyle = "#fff", c.font = "700 30px Segoe UI, Arial",
      c.fillText("PLACEMENT   PRODUCTION", 20, 38), c.fillStyle = "#25e05a", c.fillRect(20, 80, 180, 60), c.fillStyle = "#06260f", c.font = "700 34px Segoe UI, Arial",
      c.fillText("RUN", 74, 122), c.fillStyle = "#9fb4c8", c.font = "22px Consolas, monospace", ["PROGRAM  SMT-DEMO REV C", "MODE     DUAL / INDEPENDENT", s ?
        "HEAD R   16NH   LANE 2" : "HEAD F   16NH   LANE 1", "FEEDER   120 / 120"
      ].forEach((f, p) => c.fillText(f, 230, 100 + p * 34)), c.strokeStyle = "#2a4257", c.strokeRect(20, 250, 600, 210), c.fillStyle = "#0e5a30", c.fillRect(40, 275,
        260, 70), c.fillRect(40, 365, 260, 70);
    let h = new us(l);
    h.encoding = ke; monitors.push({ctx:c,tex:h});
    let d = new se(new Tn(.24, .18), new pn({
      map: h
    }));
    d.rotation.x = Math.PI / 2, d.position.set(.47, -(Qe + le) - .0805, 1.31), t.add(d);
    let u = -(Qe + le) - .052;
    td(.028, .006, ct.yellow, .52, u, 1.13, t), td(.018, .03, ct.red, .52, u - .012, 1.13, t), [
      [.4, ct.green],
      [.44, ct.white],
      [.4, ct.black],
      [.44, ct.blue]
    ].forEach(([f, p], _) => td(.011, .012, p, f, u, _ < 2 ? 1.15 : 1.11, t));
    for (let f = 0; f < 3; f++) td(.012, .01, [ct.green, ct.black, ct.blue][f], -.6075, -.782, .62 - f * .05, t);
    return Ht(.05, .002, .03, ct.yellow, -.6075, -.781, .8, t, !1), t
  }),
  qo = new We;
Xo.add(qo);
On(.012, .1, ct.steel, .55, -.62, 1.49, qo);
On(.026, .04, ct.lampG, .55, -.62, 1.56, qo);
On(.026, .04, ct.lampY, .55, -.62, 1.6, qo);
On(.026, .04, ct.lampR, .55, -.62, 1.64, qo);
On(.027, .008, ct.dark, .55, -.62, 1.664, qo);

/* Native line interface. Geometry above remains in metres/Z-up; boards below are mm/Y-up. */
const m=C.machine({id:opts.id||'placement',name:opts.name||'PLACEMENT',kind:'placement',group:machine,
  x:opts.x||0,line:opts.line,length:1280,depth:2332,height:1444,lanes:[1,2],parallel:2,inReach:150,outReach:150,
  inX:-470,outX:470,spec:{footprint:'1280 × 2332 × 1444 mm',heads:'2 × 16 nozzles',feeders:'4 × 30 slots'}});
const stats={placed:0,changes:0,rejects:0,alarms:0},pool=new We();machine.add(pool);C.dyn(pool);
const heads=vc.map((v,i)=>({i,side:v.side,lane:i+1,time:0,schedule:[],idx:0,queue:null,work:null,out:null,
  clamped:false,clamp:0,status:'STARVED',conveyor:'WAIT BOARD',placed:0,holding:Array(16).fill(null),classes:program.resident.slice(),parts:[],program:program.trips.map(t=>t.map(p=>({...p}))),optimised:false,totalPlaced:0,picks:0,rejects:0,theta:Array(16).fill(0),pickedAt:Array(16).fill(0),
  pose:{x:0,y:v.side*Fn.cam,f:0,seg:{kind:'wait',k:-1,trip:0,label:'Waiting for board',cmd:'WAIT BOARD'}}}));
/* Material buckets match PCBKit.Bucket, including the board-top translation. */
function template(jobs){
  const buckets={},g=new We();
  jobs.forEach(j=>{
    const p=j.place,base=new Yt().makeRotationY(p.rot);base.setPosition(p.x,C.BT,p.z);
    p.ls.forEach(([key,geo,mat])=>{const copy=geo.clone();copy.applyMatrix4(new Yt().multiplyMatrices(base,mat));(buckets[key]||(buckets[key]=[])).push(copy);});
  });
  Object.entries(buckets).forEach(([key,geos])=>{const merged=C.BGU.mergeBufferGeometries(geos,false);
    if(!merged)throw new Error('Placement template merge failed: '+key);
    const mesh=new se(merged,Zn.PM[key]);mesh.receiveShadow=true;g.add(mesh);geos.forEach(x=>x.dispose());});
  return g;
}
const templates=new Map();
const accumulated=allJob.slice(0,start);
program.trips.forEach((parts,trip)=>{accumulated.push(...parts.map(p=>p.job));templates.set(trip,template(accumulated));});
const finalTemplate=jobEnd===1?Zn.compsAll:template(allJob.slice(0,end));
function nozzleClass(p){if(Math.max(p.place.info.w,p.place.info.d)>12)return 'special';return p.place.key.toLowerCase().includes('sot')?'medium':p.kind==='chip'?(p.place.info.len<=1.6?'small':'medium'):p.kind==='led'||p.kind==='tant'?'medium':'large';}
const feeders=Yg.map((row,h)=>row.map(f=>{
  const width=Math.max(f.w,f.d)*1000,cap=width<=4?5000:width<=12?2000:500;
  const mesh=Zn.partGroup(f.sample);pool.add(mesh);C.dyn(mesh);
  return Object.assign(f,{capacity:cap,qty:Math.ceil(cap*(.2+Math.random()*.8)),low:false,lastPick:-100,picks:0,pitch:Math.max(4,Math.ceil((f.d*1000+2)/4)*4)/1000,mesh});
}));
// Keep inventory for every physical reel; unassigned slots are not consumed by this program.
const reels=feeders.map((row,i)=>Array.from({length:60},(_,slot)=>{
  const name=(i?'R':'F')+String(slot+1).padStart(2,'0');
  return row.find(f=>f.name===name)||{name,capacity:5000,qty:Math.ceil(5000*(.2+Math.random()*.8)),low:false,assigned:false};
}));
heads.forEach(h=>{
  h.parts=dr.map(j=>{const mesh=Zn.partGroup(j.place);mesh.visible=false;pool.add(mesh);C.dyn(mesh);return mesh;});
  h.belt=C.belt(80);C.railSeg(machine,-790,790,C.LANE_Z[h.i],{belt:h.belt});
  h.pin=C.stopper(machine,132,C.LANE_Z[h.i]);C.dyn(h.pin);
  h.nest=new We();machine.add(h.nest);
  C.box(h.nest,270,12,160,C.M.aluD,0,870,C.LANE_Z[h.i]);
  for(const x of [-100,0,100])for(const z of [-60,60])C.cyl(h.nest,3,3,23,C.M.steel,x,888.5,C.LANE_Z[h.i]+z,{seg:10});
  C.bake(h.nest);C.dyn(h.nest);
  h.clamps=[-1,1].map(s=>{const o=C.box(machine,270,3,7,C.M.steel,0,903.1,C.LANE_Z[h.i]+s*106);o.userData.side=s;C.dyn(o);return o;});
  // ANC stocker: 24 sockets, clear of the conveyor and feeder row.
  Ht(.18,.08,.018,ct.alu,-.32,h.side*.37,.89);
  for(let k=0;k<24;k++)On(.004,.002,ct.black,-.395+(k%12)*.0136,h.side*.37+(Math.floor(k/12)-.5)*.035,.900,Oe,12,false);
  // Open-topped vision reject bin.
  Ht(.08,.07,.004,ct.dark,.26,h.side*.34,.87);
  for(const s of [-1,1]){Ht(.004,.07,.045,ct.alu,.26+s*.04,h.side*.34,.89);Ht(.08,.004,.045,ct.alu,.26,h.side*.34+s*.035,.89);}
  const lamp=new THREE.PointLight(0xeaf0ff,.8,1800,1);lamp.position.set(0,1380,-h.side*300);machine.add(lamp);
});
// Rear service duct, valve manifold, cabinet ventilation and safety plate.
Ht(1.05,.035,.04,ct.dark,0,.415,.82);
for(let k=0;k<8;k++){Ht(.018,.06,.035,ct.blue,-.10+k*.028,.405,.86);On(.004,.025,ct.steel,-.10+k*.028,.405,.89);}
for(let k=0;k<12;k++)Ht(.001,.22,.004,ct.black,.652,0,.24+k*.015);
C.plate(machine,['PLACEMENT · DUAL GANTRY','KEEP CLEAR OF MOVING HEADS'],220,55,460,1040,790,{bg:'#f2c400',fg:'#111'});
/* Repeated dynamic detail: one draw per batch, with the actual consumed tape pitch. */
const detailDummy=new ae(),detailColor=new bt();
function instances(geo,mat,count,parent=machine){
  const mesh=new Fi(geo,mat,count);parent.add(mesh);C.dyn(mesh);mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);return mesh;
}
function putInstance(mesh,i,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,color){
  detailDummy.position.set(x,y,z);detailDummy.scale.set(sx,sy,sz);detailDummy.rotation.set(rx,ry,0);detailDummy.updateMatrix();
  mesh.setMatrixAt(i,detailDummy.matrix);if(color!==undefined)mesh.setColorAt(i,detailColor.set(color));
}
const tapeIndices=instances(new Nn(.001,.001,.0003),ct.pocket,120*5,Oe);
const reelSpokes=instances(new Nn(.0007,.008,.065),ct.blue,120,Oe);
const vacuumLeds=instances(new THREE.TorusGeometry(4,.7,5,12).rotateX(-Math.PI/2),new pn({color:0xffffff}),32);
const thetaMarks=instances(new Nn(4,1,1),ct.yellow,32);
const carryBody=instances(new Nn(1,1,1),de(0xffffff),32);
const carryTerminals=instances(new Nn(1,1,1),ct.steel,64);
const sensorLeds=instances(new Nn(4,4,4),new pn({color:0xffffff}),6);
heads.forEach(h=>{
  const ring=fr(new THREE.TorusGeometry(.012,.0015,5,16),boardVisionMats[h.i],sd[h.i].g,false);
  ring.position.set(-.094,0,1.028);
});
for(const side of [-1,1]){
  // Carrier tape waste trough, cutter, and film peel path over each bank.
  Ht(1.1,.045,.025,ct.alu,0,side*.61,.755);
  Ht(1.1,.004,.09,ct.dark,0,side*.632,.70);
  Ht(1.05,.003,.01,ct.steel,0,side*.612,.766);
  for(let slot=0;slot<60;slot++){
    const x=Og(slot);
    const peel=Ht(.004,.11,.0003,ct.tapeW,x,side*.58,.932);peel.rotation.x=side*.5;
    Mp(.009,.008,ct.dark,x,side*.63,.96,Oe,12);
  }
  for(const x of [-.63,.63]){
    Mp(.009,.015,ct.black,x,side*.32,.73,Oe,12);
    Ht(.006,.035,.028,ct.alu,x,side*.32,.73);
    Mp(.005,.018,ct.dark,x,side*.38,.70,Oe,10);
  }
  for(const x of [-470,0,470])C.box(machine,12,16,12,C.M.black,x,884,-side*170+113);
}
C.plate(machine,['PLACEMENT / DUAL 16','900 mm CONVEYOR · SMEMA'],180,48,-420,480,445,{bg:'#d5dadf',fg:'#222'});
C.plate(machine,['PINCH POINT','KEEP HANDS CLEAR'],120,40,-450,1020,790,{bg:'#f2c400',fg:'#111'});
/* x1 port: original distance timing, feeder-X pick order, line scan, board-X place order.
   Every segment carries its own event, executed exactly once even across coarse time steps. */
function placementOrder(parts,origin,lane){
  const remaining=parts.slice(),ordered=[];let at=origin;
  while(remaining.length){
    let best=0,distance=Infinity;
    remaining.forEach((p,i)=>{const d=Math.hypot(p.u-zo[p.k][0]-at[0],Tc[lane]+p.v-zo[p.k][1]-at[1]);if(d<distance){distance=d;best=i;}});
    const p=remaining.splice(best,1)[0];ordered.push(p);at=[p.u-zo[p.k][0],Tc[lane]+p.v-zo[p.k][1]];
  }
  return ordered;
}
function buildSchedule(h){
  const list=[];let t=0,pos=[h.pose.x,h.pose.y],classes=h.classes.slice();
  const add=(dur,kind,to,extra={})=>{const seg={t0:t,t1:t+dur,kind,a:pos.slice(),b:(to||pos).slice(),k:-1,trip:0,zt:ys.rest,label:kind,cmd:kind.toUpperCase(),...extra};list.push(seg);t+=dur;pos=seg.b;return seg;};
  const move=(to,extra={})=>{const d=Math.hypot(to[0]-pos[0],to[1]-pos[1]);if(d>1e-6)add(.03+.25*Math.sqrt(d),'move',to,{cmd:'MOVE X'+(to[0]*1000).toFixed(1)+' Y'+(to[1]*1000).toFixed(1),...extra});};
  const pick=(p,retry=false)=>{
    const f=feeders[h.i][_1[p.key]],off=zo[p.k];move([f.x-off[0],f.y-off[1]],{trip:p.trip,label:'Travel to '+f.name});
    add(_p.pick,'pick',null,{p,k:p.k,trip:p.trip,zt:f.z+p.h,feeder:f,retry,label:'Pick '+p.place.name,cmd:'PICK N'+(p.k+1)+' <- '+f.name+' VAC ON'});
  };
  const place=p=>{const off=zo[p.k];move([p.u-off[0],Tc[h.i]+p.v-off[1]],{trip:p.trip,gate:true,label:'Travel to placement'});
    add(_p.place,'place',null,{p,k:p.k,trip:p.trip,zt:ys.pcb+p.h,gate:true,label:'Place '+p.place.name,cmd:'PLACE N'+(p.k+1)+' X'+(p.u*1000).toFixed(1)+' Y'+(p.v*1000).toFixed(1)+' VAC OFF'});};
  for(let trip=0;trip<Mc;trip++){
    const parts=h.program[trip].map(p=>({...p}));
    const changes=trip===program.specialStart?program.specialSockets.filter(k=>classes[k]!=='special').map(k=>({k,nozzleClass:'special'})):[];
    if(changes.length){
      move([-.32,h.side*.37],{trip,label:'Travel to ANC'});
      add(.6+.05*changes.length,'anc',null,{trip,changes,
        label:'Change '+changes.length+' nozzles',
        cmd:'ANC '+changes.map(c=>'N'+(c.k+1)).join(',')+' -> '+changes.map(c=>c.nozzleClass.toUpperCase()).join('/')});
      changes.forEach(c=>classes[c.k]=c.nozzleClass);
    }
    // Improve travel using only same-class swaps: the minimum change set is unchanged.
    // Evaluate the actual feeder/board order and the original move-duration formula.
    const routeCost=()=>{
      let at=pos.slice(),cost=0;
      const visit=to=>{const d=Math.hypot(to[0]-at[0],to[1]-at[1]);if(d>1e-6)cost+=.03+.25*Math.sqrt(d);at=to;};
      parts.slice().sort((a,b)=>(feeders[h.i][_1[a.key]].x-zo[a.k][0])-(feeders[h.i][_1[b.key]].x-zo[b.k][0]))
        .forEach(p=>{const f=feeders[h.i][_1[p.key]],off=zo[p.k];visit([f.x-off[0],f.y-off[1]]);});
      const sign=at[0]>=0?1:-1;visit([sign*.11,h.side*Fn.cam]);at=[-sign*.11,h.side*Fn.cam];
      if(trip===0)for(const f of [C.FIDS[1],C.FIDS[2]])visit([f.x/1000+.094,Tc[h.i]-f.z/1000]);
      placementOrder(parts,at,h.i).forEach(p=>visit([p.u-zo[p.k][0],Tc[h.i]+p.v-zo[p.k][1]]));
      visit([0,h.side*Fn.cam]);return cost;
    };
    if(!h.optimised){
    let best=routeCost();
    for(let pass=0;pass<4;pass++){
      let improved=false;
      for(let a=0;a<parts.length;a++)for(let b=a+1;b<parts.length;b++){
        const p=parts[a],q=parts[b];if(nozzleClass(p)!==nozzleClass(q)||nozzleClass(p)==='special')continue;
        [p.k,q.k]=[q.k,p.k];const cost=routeCost();
        if(cost<best-1e-6){best=cost;improved=true;}else [p.k,q.k]=[q.k,p.k];
      }
      if(!improved)break;
    }
    h.program[trip]=parts.map(p=>({...p}));
    }
    const rejects=parts.filter(()=>Math.random()<.004);
    parts.slice().sort((a,b)=>(feeders[h.i][_1[a.key]].x-zo[a.k][0])-(feeders[h.i][_1[b.key]].x-zo[b.k][0])).forEach(p=>pick(p));
    const sign=pos[0]>=0?1:-1;move([sign*.11,h.side*Fn.cam],{trip,label:'Travel to line camera'});
    add(_p.scan,'scan',[-sign*.11,h.side*Fn.cam],{trip,label:'Recognise parts on the fly',cmd:'SCAN LINE-CAM '+parts.length});
    for(const p of rejects){move([.26-zo[p.k][0],h.side*.34-zo[p.k][1]],{trip,label:'Travel to reject bin'});
      add(.1,'reject',null,{p,k:p.k,trip,label:'Reject '+p.place.name,cmd:'DUMP N'+(p.k+1)+' VAC OFF'});}
    if(trip===0)for(const f of [C.FIDS[1],C.FIDS[2]]){
      move([f.x/1000+.094,Tc[h.i]-f.z/1000],{trip,gate:true,label:'Locate board fiducial'});
      add(.15,'fiducial',null,{trip,gate:true,label:'Capture board fiducial',cmd:'VISION BOARD-CAM CAPTURE'});
    }
    placementOrder(parts.filter(p=>!rejects.includes(p)),pos,h.i).forEach(place);
    // Retry rejected components after the good parts; retry is inspected and accepted.
    for(const p of rejects){pick(p,true);move([.11,h.side*Fn.cam],{trip});
      add(_p.scan,'scan',[-.11,h.side*Fn.cam],{trip,label:'Verify replacement',cmd:'SCAN RETRY OK'});place(p);}
    add(.001,'batch',null,{trip,count:trip,gate:true,label:'Trip complete',cmd:'TRIP COMPLETE'});
  }
  if(program.specialSockets.length){
    const changes=program.specialSockets.map(k=>({k,nozzleClass:program.resident[k]}));
    move([-.32,h.side*.37],{label:'Return resident nozzle set'});
    add(.6+.05*changes.length,'anc',null,{trip:Math.max(0,Mc-1),changes,label:'Restore resident set',cmd:'ANC RESTORE RESIDENT'});
  }
  h.optimised=true;
  move([0,h.side*Fn.cam],{label:'Retreat from board'});
  if(!list.length)add(.01,'wait',null,{gate:true});
  return list;
}
function event(h,s){
  if(s.kind==='pick'){
    s.feeder.qty--;s.feeder.lastPick=C.T.sim;s.feeder.picks++;h.picks++;h.pickedAt[s.k]=h.time;h.theta[s.k]=0;
    if(!s.feeder.low&&s.feeder.qty<=s.feeder.capacity*.03){s.feeder.low=true;stats.alarms++;m.addLog('FEEDER '+s.feeder.name+' LOW — 3% remaining','cl');}
    h.holding[s.k]=s.p;
  }else if(s.kind==='place'){
    const p=s.p,o=h.parts[dr.indexOf(p.job)];h.work.parts.add(o);o.position.set(p.place.x,C.BT,p.place.z);o.rotation.set(0,p.rot,0);
    h.theta[s.k]=s.p.rot;h.holding[s.k]=null;h.placed++;h.totalPlaced++;stats.placed++;
  }else if(s.kind==='reject'){h.holding[s.k]=null;h.parts[dr.indexOf(s.p.job)].visible=false;stats.rejects++;h.rejects++;}
  else if(s.kind==='anc'){s.changes.forEach(c=>h.classes[c.k]=c.nozzleClass);stats.changes+=s.changes.length;}
  else if(s.kind==='batch'){
    h.parts.forEach(o=>{pool.add(o);o.visible=false;});
    h.work.setComps(templates.get(s.count));h.work.setStage('placing');
  }
}
function* timed(h,s){
  let elapsed=0,done=false;
  const duration=s.t1-s.t0;
  while(elapsed<duration){
    // Carry unused substep time into the next segment instead of rounding every move up.
    let dt=h.remaining||0;h.remaining=0;
    if(!dt){dt=yield C.FRAME;if(m.down)continue;}
    const used=Math.min(duration-elapsed,dt);elapsed+=used;h.remaining=dt-used;
    h.time=s.t0+elapsed;
    if(!done&&elapsed>=duration/2){event(h,s);done=true;}
  }
}
function* headLoop(h){
  while(true){
    h.schedule=buildSchedule(h);
    h.programStats={trips:Mc,ancVisits:h.schedule.filter(s=>s.kind==='anc').length,
      changes:h.schedule.filter(s=>s.kind==='anc').reduce((n,s)=>n+s.changes.length,0),cycle:h.schedule.at(-1).t1};
    h.time=0;h.placed=0;h.idx=0;h.remaining=0;
    for(const s of h.schedule){
      h.pose.seg=s;
      while(m.down){h.remaining=0;yield C.FRAME;}
      if(s.gate){h.status='STARVED';while(!h.clamped||m.down){h.remaining=0;yield C.FRAME;}}
      h.status='RUN';
      if(s.kind==='pick'&&s.feeder.qty<=0){
        stats.alarms++;h.remaining=0;yield* m.fault('FEEDER '+s.feeder.name+' EMPTY — splice reel',40);
        s.feeder.qty=s.feeder.capacity;s.feeder.low=false;
      }
      yield* timed(h,s);h.idx++;
    }
    // Empty jobs also wait for a clamped board before transferring.
    while(!h.clamped||m.down){h.remaining=0;yield C.FRAME;}
    const b=h.work;
    if(jobEnd===1){
      b.setStage('placed');
      if(Math.random()<(opts.defectRate===undefined?.07:opts.defectRate)){
        const k=Math.floor(Math.random()*Zn.cands.length),types=(C.DEF[Zn.cands[k].kind]||[]).filter(t=>['MISSING','SHIFT','ROTATED','POLARITY'].includes(t));
        if(types.length)b.addDefect(k,types[Math.floor(Math.random()*types.length)],'placement');
      }
    }else b.setComps(finalTemplate);
    h.status='BLOCKED';h.conveyor='WAIT OUTFEED';
    while(h.out||m.down)yield C.FRAME;
    h.status='RUN';h.conveyor='UNCLAMP';yield* C.tween(.25,k=>h.clamp=1-k);
    h.clamped=false;h.pin.userData.up=false;h.out=b;h.conveyor='CONV OUT';
    yield* C.conveyTo(b,m.world(470),h.belt);
    h.work=null;m.setReady(b,h.lane);m.endCycle(b,h.started);m.addLog('#'+b.sn+' placed '+dr.length+' parts','ok');
    h.conveyor='WAIT BOARD';h.status='STARVED';
  }
}
m.canAccept=lane=>!!heads[lane-1]&&!m.down&&!heads[lane-1].queue;
m.onAccept=(b,lane)=>{
  const h=heads[lane-1];h.queue=b;
  C.run((function*(){yield* C.conveyTo(b,m.world(-470),h.belt);
    while(h.work||m.down)yield C.FRAME;
    h.work=b;h.started=C.T.sim;h.conveyor='CONV IN';
    yield* C.conveyTo(b,m.world(0),h.belt);h.queue=null;
    h.pin.userData.up=true;h.conveyor='CLAMP + SUPPORT';
    yield* C.tween(.25,k=>h.clamp=k);b.setStage('placing');h.clamped=true;h.conveyor='HOLD CLAMPED';
  })());
};
m.onRelease=(b,lane)=>{const h=heads[lane-1];if(h.out===b)h.out=null;};
heads.forEach(h=>C.run(headLoop(h)));
C.onTick(()=>{
  if(m.down)return;
  const state=heads.some(h=>h.status==='RUN')?'RUN':heads.some(h=>h.status==='BLOCKED')?'BLOCKED':'STARVED';
  m.setState(state,'DUAL HEAD',heads.map(h=>h.pose.seg.label).join(' / '));
});
function pose(h){
  const s=h.schedule[Math.min(h.idx,h.schedule.length-1)]||h.pose.seg;
  if(!s.a)return h.pose;
  const f=Yi((h.time-s.t0)/(s.t1-s.t0),0,1),k=s.kind==='move'?_s(f):f;
  return {x:ur(s.a[0],s.b[0],k),y:ur(s.a[1],s.b[1],k),f,seg:s};
}
const nozzleZ=(p,k)=>p.seg.k===k&&['pick','place'].includes(p.seg.kind)?ys.rest-Math.sin(Math.PI*p.f)*(ys.rest-p.seg.zt):ys.rest;
let covers='solid',pathEnabled=false;
function setCovers(mode){
  covers=mode;Xo.visible=mode!=='off';const ghost=mode==='ghost';
  [ct.coverWhite,ct.coverBlack].forEach(mt=>{mt.transparent=ghost;mt.opacity=ghost?.1:1;mt.depthWrite=!ghost;mt.needsUpdate=true;});
  ct.coverGlass.opacity=ghost?.08:.5;
}
function setDoor(i,on){Zi[i].open=!!on;}
m.update=(dt,rdt)=>{
  // Iso sits ~5 m out. Individual parts and the head interior are invisible there and were the draw-call overrun.
  const detail=m.camDist<3800;
  heads.forEach(h=>{
    const p=pose(h);h.pose=p;const g=sd[h.i];g.g.position.set(p.x,p.y,0);g.beam.position.y=p.y;
    g.g.visible=detail||covers!=='solid';
    g.noz.forEach((o,k)=>{
      const part=h.holding[k],index=h.i*16+k;
      if(part)h.theta[k]=part.rot*_s(Yi((h.time-h.pickedAt[k])/.2,0,1));
      const angle=h.theta[k],tip=nozzleZ(p,k),x=(p.x+zo[k][0])*1000,z=-(p.y+zo[k][1])*1000,y=tip*1000;
      o.position.z=tip;o.rotation.z=angle;
      putInstance(vacuumLeds,index,x,y+20,z,1,1,1,angle,0,part?0x20e080:0x28302b);
      putInstance(thetaMarks,index,x+Math.cos(angle)*3,y+6,z-Math.sin(angle)*3,1,1,1,angle);
      const size=part?part.place.info:null,scale=part?1:0;
      putInstance(carryBody,index,x,y-(size?size.h/2:0),z,scale*(size?size.w:1),scale*(size?size.h:1),scale*(size?size.d:1),angle,0,part?Xg[part.kind]:0x222222);
      for(let t=0;t<2;t++){
        const dx=size?(t?1:-1)*size.w*.42:0;
        putInstance(carryTerminals,index*2+t,x+Math.cos(angle)*dx,y-(size?size.h*.5:0),z-Math.sin(angle)*dx,
          scale*(size?size.w*.16:1),scale*(size?size.h*.65:1),scale*(size?size.d*.85:1),angle);
      }
    });
    h.nest.position.y=-12*(1-h.clamp);h.clamps.forEach(o=>o.position.z=C.LANE_Z[h.i]+o.userData.side*(106-5*h.clamp));
    ct.camGlass[h.i].emissiveIntensity=p.seg.kind==='scan'&&p.f>.35&&p.f<.65?4:.05;
    boardVisionMats[h.i].emissiveIntensity=p.seg.kind==='fiducial'&&p.f>.25&&p.f<.75?3:.05;
    [-470,0,470].forEach((x,k)=>putInstance(sensorLeds,h.i*3+k,x,894,C.LANE_Z[h.i]+114,1,1,1,0,0,
      [h.queue&&Math.abs(h.queue.x-m.world(-470))<10,h.work&&Math.abs(h.work.x-m.world(0))<10,h.out&&Math.abs(h.out.x-m.world(470))<10][k]?0x2eff65:0x292c28));
    h.parts.forEach(o=>{o.visible=detail&&!!(h.work&&o.parent===h.work.parts);});
    g.path.visible=pathEnabled&&m.near;
    if(g.path.visible&&(g.shown!==p.seg.trip||g.path.userData.schedule!==h.schedule)){
      g.shown=p.seg.trip;g.path.userData.schedule=h.schedule;g.path.geometry.dispose();
      g.path.geometry=new Zt().setFromPoints(h.schedule.filter(s=>s.trip===p.seg.trip).flatMap(s=>[new R(...s.a,0),new R(...s.b,0)]));
    }
    feeders[h.i].forEach(f=>{const k=Yi((C.T.sim-f.lastPick)/.12,0,1);f.mesh.visible=detail&&k>.15&&f.qty>0;f.mesh.position.copy(xs(f.x,f.y+h.side*(1-_s(k))*f.pitch,f.z));});
  });
  for(let i=0;i<120;i++){
    const h=i<60?0:1,slot=i%60,f=reels[h][slot],side=h?1:-1;
    const advance=(f.picks||0)* (f.pitch||.004)-(f.picks?1-_s(Yi((C.T.sim-f.lastPick)/.12,0,1)):0)*(f.pitch||.004);
    const n=slot%30,entry=Qg[i];detailDummy.position.set(entry.p[0]+.006,entry.p[1],entry.p[2]);
    detailDummy.scale.set(1,1,1);detailDummy.rotation.set(side*advance/.09,0,0);detailDummy.updateMatrix();reelSpokes.setMatrixAt(i,detailDummy.matrix);
    for(let j=0;j<5;j++)putInstance(tapeIndices,i*5+j,Og(slot)-.0052,side*(.462+j*.004+(advance%.004)),.9007);
  }
  [tapeIndices,reelSpokes,vacuumLeds,thetaMarks,carryBody,carryTerminals].forEach(mesh=>{
    mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.visible=detail;
  });
  sensorLeds.instanceMatrix.needsUpdate=true;if(sensorLeds.instanceColor)sensorLeds.instanceColor.needsUpdate=true;sensorLeds.visible=m.near;
  Zi.forEach(d=>{d.a+=((d.open?1:0)-d.a)*Math.min(1,(rdt||dt)*6);d.g.rotation.x=-1.25*_s(Yi(d.a,0,1));});
  C.tower(m,{r:ct.lampR,y:ct.lampY,g:ct.lampG},feeders.some(row=>row.some(f=>f.low)));
};
C.onSlow(()=>{if(!m.near)return;monitors.forEach((o,i)=>{const h=heads[i],g=o.ctx;
  g.fillStyle='#0d1722';g.fillRect(0,0,640,480);g.fillStyle='#1e6fd9';g.fillRect(0,0,640,56);g.fillStyle='#fff';g.font='700 28px Arial';g.fillText('PLACEMENT · HEAD '+(i?'R':'F'),20,38);
  g.font='20px monospace';
  const rate=Math.round(h.totalPlaced/Math.max(1,C.T.sim)*3600),ppm=Math.round(h.rejects/Math.max(1,h.picks)*1e6);
  [m.down?'ALARM':h.status+' / '+h.conveyor,h.pose.seg.label,
   'PLACED '+h.placed+'/'+dr.length+'   '+rate+' CPH',
   'TRIPS '+Mc+'   REJECT '+ppm+' ppm'].forEach((t,k)=>g.fillText(t,20,88+k*34));
  h.classes.forEach((cl,k)=>{const x=20+(k%8)*76,y=248+Math.floor(k/8)*54;
    g.fillStyle=h.holding[k]?'#25e05a':'#9fb4c8';g.fillText('N'+(k+1),x,y);
    g.font='14px monospace';g.fillText(cl.toUpperCase().slice(0,4),x,y+20);g.font='20px monospace';});
  g.fillStyle='#f0b840';const alarms=feeders[i].filter(f=>f.low||!f.qty);
  (alarms.length?alarms.slice(0,3).map(f=>f.name+' '+(f.qty?'LOW '+f.qty:'EMPTY — SPLICE')):['FEEDERS OK']).forEach((t,k)=>g.fillText(t,20,382+k*28));
  o.tex.needsUpdate=true;
});});
m.views={
 iso:{p:[-2900,2500,3300],t:[0,800,0]},front:{p:[0,1300,5000],t:[0,850,0]},side:{p:[5200,1300,0],t:[0,850,0]},
 top:{p:[0,6000,20],t:[0,800,0],hood:1},gantry:{p:[-950,1750,1950],t:[-120,980,150],hood:1},
 board:{p:[300,1130,950],t:[0,900,150],hood:1},pickf:{p:[-160,1080,830],t:[0,950,470],hood:1},
 pickr:{p:[160,1080,-830],t:[0,950,-470],hood:1}};
m.cameras=[{name:'Head F board camera',cam:new THREE.OrthographicCamera(-20,20,20,-20,1,300),
 prepare:c=>{const o=m.origin(),p=heads[0].pose;c.up.set(0,0,-1);c.position.set(o.x+p.x*1000-94,o.y+1028,o.z-p.y*1000);c.lookAt(c.position.x,o.y+900,c.position.z);}},
 {name:'Line camera F',cam:new THREE.OrthographicCamera(-90,90,35,-35,1,250),
 prepare:c=>{const o=m.origin();c.up.set(0,0,-1);c.position.set(o.x,o.y+889,o.z+340);c.lookAt(o.x,o.y+1100,o.z+340);}}];
m.info=()=>[['Head F',heads[0].status+' · '+heads[0].placed+'/'+dr.length],['Head R',heads[1].status+' · '+heads[1].placed+'/'+dr.length],
 ['Trips / board',Mc],['ANC visits / board',heads[0].programStats?.ancVisits||0],['Boards out',m.counters.out],['Cycle',m.avgCt().toFixed(1)+' s'],['Nozzle changes',stats.changes],['Vision rejects',stats.rejects],['Feeder alarms',stats.alarms]];
Object.assign(m,{program,heads,feeders,reels,stats,doors:Zi,job:dr,setCovers,setDoor,setPath:on=>pathEnabled=!!on,pose:i=>pose(heads[i])});
C.shellMats.push(ct.coverWhite,ct.coverBlack);
Zi.forEach((d,i)=>{C.bake(d.g);C.dyn(d.g);C.clickable(d.g,()=>setDoor(i,!d.open));});
sd.forEach(g=>{
  g.noz.forEach(n=>{C.bake(n);C.dyn(n);});
  C.bake(g.beam);C.bake(g.g);C.dyn(g.beam,g.g,g.path);
});
C.bake(Xo);C.dyn(Xo);C.bake(machine);
if(opts.standalone){
  const views={};Object.entries(m.views).forEach(([k,v])=>{
    views[k]=()=>{
      if(v.hood)setDoor(k==='pickr'?1:0,true);
      if(k==='pickf'||k==='pickr'){
        const h=heads[k==='pickr'?1:0],offset=new R(h.side*160,130,-h.side*360);
        const target=new R(),position=new R();
        const destination=()=>{const p=pose(h),o=m.origin();target.copy(o).add(xs(p.x,p.y,.95));position.copy(target).add(offset);
          position.x=Math.min(o.x+560,Math.max(o.x-560,position.x));};   /* keep the camera inside the side covers (x = +/-645) */
        destination();C.flyTo(position.toArray(),target.toArray());
        return rdt=>{destination();const alpha=1-Math.exp(-8*Math.max(0,rdt));
          C.camera.position.lerp(position,alpha);C.controls.target.lerp(target,alpha);};
      }
      const o=m.origin();C.flyTo(v.p.map((n,i)=>n+[o.x,o.y,o.z][i]),v.t.map((n,i)=>n+[o.x,o.y,o.z][i]));
    };
  });C.addViews(views);
  C.expose({placement:m,setDoor,setCovers,JOB:dr});
}
return m;
});
