a
}
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
  return r.colorSpace = ke, r.anisotropy = 8, n.repeat && (r.wrapS = r.wrapT = os), r
}
var Zn = kp(pp, s => Ug(s, !1), od),
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
var Mc = Math.ceil(dr.length / vs),
  Ho = [0, 1].flatMap(s => dr.map(t => ({
    ...t,
    head: s,
    src: Yg[s][_1[t.key]],
    tPick: 0,
    tPlace: 0
  }))),
  hr = [
    [],
    []
  ],
  ed = [],
  we = 1,
  ko = 0,
  bc = [0, 0],
  Qu = s => (s * 1e3 >= 0 ? "+" : "") + (s * 1e3).toFixed(1);

function x1() {
  hr = [
    [],
    []
  ];
  let s = 0,
    t = [0, 0],
    e = r => "N" + String(r + 1).padStart(2, "0");
  for (let r of [0, 1]) {
    let o = vc[r].side,
      a = hr[r],
      l = [0, o * Fn.cam],
      c = 0,
      h = (u, f, p, _ = {}) => {
        let g = l.slice(),
          m = p ? p.slice() : g,
          v = {
            t0: c,
            t1: c + u,
            kind: f,
            a: g,
            b: m,
            k: -1,
            trip: 0,
            zt: 0,
            label: "",
            cmd: "",
            ..._
          };
        return a.push(v), c = v.t1, l = m, v
      },
      d = (u, f) => {
        let p = Math.hypot(u[0] - l[0], u[1] - l[1]);
        p < 1e-6 || h(.03 + .25 * Math.sqrt(p), "move", u, {
          cmd: `MOVE X${Qu(u[0])} Y${Qu(u[1])}`,
          ...f
        })
      };
    for (let u = 0; u < Mc; u++) {
      let f = Ho.filter(g => g.head === r && g.trip === u);
      for (let g of f.slice().sort((m, v) => m.src.x - zo[m.k][0] - (v.src.x - zo[v.k][0]))) {
        let m = zo[g.k];
        d([g.src.x - m[0], g.src.y - m[1]], {
          trip: u,
          label: "Travel to " + g.src.name
        });
        let v = h(_p.pick, "pick", null, {
          k: g.k,
          trip: u,
          zt: g.src.z + g.h,
          label: `Pick ${g.place.name} from feeder ${g.src.name}`,
          cmd: `PICK ${e(g.k)} <- ${g.src.name}  VAC ON`
        });
        g.tPick = (v.t0 + v.t1) / 2
      }
      let p = l[0] >= 0 ? 1 : -1;
      d([p * .11, o * Fn.cam], {
        trip: u,
        label: "Travel to line camera"
      }), h(_p.scan, "scan", [-p * .11, o * Fn.cam], {
        trip: u,
        label: "Recognise parts on the fly",
        cmd: `SCAN LINE-CAM  ${f.length} parts`
      });
      let _ = Fe.tMove + Fe.tClamp;
      c < _ && h(_ - c, "wait", null, {
        trip: u,
        label: "Wait: board transfer",
        cmd: "WAIT BOARD"
      });
      for (let g of f.slice().sort((m, v) => m.u - v.u)) {
        let m = zo[g.k];
        d([g.u - m[0], Tc[r] + g.v - m[1]], {
          trip: u,
          label: "Travel to placement"
        });
        let v = h(_p.place, "place", null, {
          k: g.k,
          trip: u,
          zt: ys.pcb + g.h,
          label: `Place ${g.place.name}`,
          cmd: `PLACE ${e(g.k)} X${Qu(g.u)} Y${Qu(g.v)} R${Math.round(g.rot*180/Math.PI)}  VAC OFF`
        });
        g.tPlace = (v.t0 + v.t1) / 2
      }
    }
    d([0, o * Fn.cam], {
      trip: Mc - 1,
      label: "Retreat from board"
    }), t[r] = c, s = Math.max(s, c)
  }
  ko = s + .1, we = ko + Fe.tMove, bc = [0, we * .42];
  for (let r of [0, 1]) hr[r].push({
    t0: t[r],
    t1: we,
    kind: "wait",
    a: [0, vc[r].side * Fn.cam],
    b: [0, vc[r].side * Fn.cam],
    k: -1,
    trip: Mc - 1,
    zt: 0,
    label: "Idle: board transfer",
    cmd: ""
  });
  let n = Fe.tMove,
    i = n + Fe.tClamp;
  ed = [{
    t0: 0,
    t1: n,
    kind: "in",
    label: "Transfer board in",
    cmd: "CONV FWD  stopper UP"
  }, {
    t0: n,
    t1: i,
    kind: "clamp",
    label: "Clamp board, read fiducials",
    cmd: "CLAMP ON"
  }, {
    t0: i,
    t1: ko,
    kind: "hold",
    label: "Board clamped",
    cmd: "HOLD"
  }, {
    t0: ko,
    t1: we,
    kind: "out",
    label: "Transfer board out",
    cmd: "CLAMP OFF  CONV FWD"
  }]
}
x1();
var nd = (s, t) => ((t - bc[s]) % we + we) % we;

function Zg(s, t) {
  let e = 0,
    n = s.length - 1;
  for (; e < n;) {
    let i = e + n >> 1;
    s[i].t1 <= t ? e = i + 1 : n = i
  }
  return s[e]
}

function id(s, t) {
  let e = Zg(hr[s], t),
    n = e.t1 > e.t0 ? Yi((t - e.t0) / (e.t1 - e.t0), 0, 1) : 1,
    i = e.kind === "move" ? _s(n) : n;
  return {
    x: ur(e.a[0], e.b[0], i),
    y: ur(e.a[1], e.b[1], i),
    seg: e,
    f: n
  }
}
var Bg = (s, t) => s.seg.k === t && (s.seg.kind === "pick" || s.seg.kind === "place") ? ys.rest - Math.sin(Math.PI * s.f) * (ys.rest - s.seg.zt) : ys.rest;

function zg(s) {
  return s < Fe.tMove ? ur(Fe.xIn, 0, _s(s / Fe.tMove)) : s > ko ? ur(0, Fe.xOut, _s(Yi((s - ko) / Fe.tMove, 0, 1))) : 0
}
var y1 = Ec.stage(),
  Ti = new yc({
    canvas: pe("c"),
    antialias: !0,
    powerPreference: "high-performance"
  });
Ti.outputColorSpace = ke;
Ti.toneMapping = bo;
Ti.shadowMap.enabled = !0;
Ti.shadowMap.type = Al;
Ti.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
var Cn = new Ni,
  ui = new Pe(34, 1, 2, 6e4),
  Jn = new $u(ui, Ti.domElement);
Jn.enableDamping = !0;
Jn.dampingFactor = .1;
Jn.minDistance = 40;
Jn.maxDistance = 14e3;
Jn.maxPolarAngle = Math.PI * .52;
Jn.zoomSpeed = 1.2;
var v1 = new ar(Ti);
Cn.environment = v1.fromScene(new ju, .03).texture;
Cn.environmentIntensity = .45;
var Ei = new $s(16774890, 1.5);
Ei.position.set(2600, 5200, 3600);
Ei.castShadow = !0;
Ei.shadow.mapSize.set(2048, 2048);
Ei.shadow.bias = -3e-4;
Ei.shadow.normalBias = 4;
Object.assign(Ei.shadow.camera, {
  left: -2600,
  right: 2600,
  top: 2600,
  bottom: -2600,
  near: 500,
  far: 12e3
});
Cn.add(Ei, Ei.target);
Ei.target.position.set(0, 600, 0);
var Jg = new Zs(16777215, 9080726, .25);
Cn.add(Jg);
var Oe = new We;
Oe.rotation.x = -Math.PI / 2;
Oe.scale.setScalar(1e3);
Cn.add(Oe);
var xs = (s, t, e) => new R(s * 1e3, e * 1e3, -t * 1e3);
for (let s of [-.3, .3]) {
  let t = new ki(15397631, .9 * Math.pow(1e3, 1.4), 1800, 1.4);
  t.position.set(0, s, 1.38), Oe.add(t)
}
var de = (s, t = {}) => new gn({
    color: s,
    roughness: .55,
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
  o.colorSpace = ke, o.anisotropy = 8;
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
var bp = new gn({
  color: 16777215,
  roughness: .82
});
{
  let s = new se(new Tn(4e4, 4e4), bp);
  s.rotation.x = -Math.PI / 2, s.receiveShadow = !0, Cn.add(s);
  let t = od(64, 64, e => {
    e.fillStyle = "#e8b923", e.fillRect(0, 0, 64, 64)
  });
  for (let e of [1250, -1250]) {
    let n = new se(new Tn(4600, 60), new pn({
      map: t,
      transparent: !0,
      opacity: .55
    }));
    n.rotation.x = -Math.PI / 2, n.position.set(0, 1, e), Cn.add(n)
  }
}
var b1 = s => {
    let t = od(512, 512, (e, n, i) => {
      e.fillStyle = s ? "#232a34" : "#d5dae0", e.fillRect(0, 0, n, i), e.strokeStyle = s ? "rgba(255,255,255,.055)" : "rgba(0,0,0,.07)", e.lineWidth = 2, e
        .strokeRect(0, 0, n, i)
    }, {
      repeat: !0
    });
    return t.repeat.set(40, 40), t
  },
  Kg = new gn({
    color: 2830909,
    roughness: .75,
    metalness: .1
  });

function E1(s, t, e, n, i, r) {
  let o = od(900, Math.round(900 * e / t), (l, c, h) => {
      l.fillStyle = "#1e6fd9", l.fillRect(0, 0, c, h), l.fillStyle = "#fff", l.font = `700 ${Math.round(h*.46)}px "Segoe UI", Arial, sans-serif`, l.textAlign =
        "center", l.textBaseline = "middle", l.fillText(s, c / 2, h / 2 + h * .04)
    }),
    a = new se(new Tn(t, e), new pn({
      map: o,
      toneMapped: !1
    }));
  a.rotation.x = -Math.PI / 2, a.position.set(n, i, r), Cn.add(a)
}
for (let s of [-1, 1]) {
  let t = new se(new Nn(640, 1e3, 800), Kg);
  t.position.set(s * 1980, 500, 0), t.castShadow = t.receiveShadow = !0, Cn.add(t), E1(s < 0 ? "FROM SPI  \u25B6" : "\u25B6  TO REFLOW", 560, 78, s * 1980, 1001, 310)
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
for (let s of Tc) {
  for (let t of [-1, 1]) {
    Ht(3.3, .012, .035, ct.alu, 0, s + t * .107, .8905), Ht(3.3, .004, .002, ct.rubber, 0, s + t * .099, .8974, Oe, !1);
    for (let e of [-.45, 0, .45]) Ht(.03, .012, .075, ct.dark, e, s + t * .107, .8375)
  }
  Ht(.27, .18, .01, ct.black, 0, s, .86);
  for (let t of [-.1, 0, .1])
    for (let e of [-.06, .06]) On(.003, .0334, ct.steel, t, s + e, .8817, Oe, 10, !1);
  for (let t of [-1, 1]) Ht(.012, .03, .03, ct.yellow, t * .135, s + .09, .884, Oe, !1)
}
for (let s of [-1.55, -.95, .95, 1.55]) {
  Ht(.04, .64, .03, ct.grey, s, 0, .858);
  for (let t of [-1, 1]) Ht(.04, .04, .845, ct.grey, s, t * .3, .4225), Ht(.1, .1, .012, ct.dark, s, t * .3, .006)
}
for (let s of [-1, 1])
  for (let t of [-1, 1]) Ht(.64, .03, .03, ct.grey, s * 1.25, t * .3, .3);
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
pr(Wo, ct.pocket, i_, Oe, !1);
var s_ = new We;
Cn.add(s_);

function r_(s) {
  let t = Zn.partGroup(s);
  return t.traverse(e => {
    e.isMesh && (e.castShadow = s.info.h > 1)
  }), s_.add(t), t
}
for (let s of Ho) s.mesh = r_(s.place);
var T1 = [0, 1].flatMap(s => Yg[s].map(t => (t.w > .0045 && Ht(Math.min(.028, t.w + .004), .14, 5e-4, ct.tapeB, t.x, Math.sign(t.y) * .53, .90015, Oe, !1), Ht(t.w + 8e-4,
    t.d + 8e-4, 2e-4, ct.pocket, t.x, t.y, .9002, Oe, !1), {
    h: s,
    f: t,
    mesh: r_(t.sample),
    picks: Ho.filter(e => e.src === t).map(e => e.tPick).sort((e, n) => e - n)
  }))),
  w1 = new gn({
    color: 9409174,
    roughness: .82,
    metalness: .35
  }),
  A1 = Zn.pasteGeo();

function xp(s) {
  let t = s ? Zn.inst(Zn.board, Zn.compsAll) : Zn.inst(Zn.board);
  return t.add(new se(A1, w1)), Cn.add(t), t
}
var C1 = Tc.map(() => ({
    work: xp(!1),
    queue: xp(!1),
    done: xp(!0)
  })),
  yp = (s, t, e) => s.position.set(t * 1e3, ys.pcb * 1e3 - Zn.BT, -Tc[e] * 1e3),
  sd = vc.map((s, t) => {
    let e = s.side,
      n = new We,
      i = new We;
    Oe.add(n, i), Ht(1.19, .1, .13, ct.beam, 0, e * .115, 1.235, n), Ht(1.1, .006, .016, ct.steel, 0, e * .063, 1.275, n), Ht(1.1, .006, .016, ct.steel, 0, e * .063,
      1.195, n), Ht(1.1, .004, .04, ct.magnet, 0, e * .064, 1.235, n), Ht(1.1, .102, .012, ct.yellow, 0, e * .115, 1.302, n, !1);
    for (let l of [-1, 1]) Ht(.07, .16, .05, ct.dark, l * .615, e * .115, 1.165, n);
    Ht(1, .05, .02, ct.black, 0, e * .135, 1.318, n), Ht(.16, .1, .2, ct.inner, 0, e * .01, 1.18, i), Ht(.164, .104, .03, ct.headCover, 0, e * .01, 1.295, i), Ht(.06,
      .004, .035, ct.yellow, .03, -e * .041, 1.22, i, !1), Ht(.12, .004, .07, ct.black, 0, -e * .041, 1.14, i, !1), Ht(.16, .07, .05, ct.dark, 0, 0, 1.055, i), On(
      .012, .06, ct.black, -.094, 0, 1.06, i), On(.009, .004, ct.camGlass[t], -.094, 0, 1.028, i, 16, !1);
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
    h.colorSpace = ke;
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
var ad = "solid",
  a_ = () => {
    pe("tip").style.display = ad === "solid" && !Zi.some(s => s.open) ? "" : "none"
  };

function Ap(s) {
  ad = s, Xo.visible = s !== "off";
  let t = s === "ghost";
  for (let e of [ct.coverWhite, ct.coverBlack]) e.transparent = t, e.opacity = t ? .1 : 1, e.depthWrite = !t, e.needsUpdate = !0;
  ct.coverGlass.opacity = t ? .08 : .5;
  for (let e of o_) e.castShadow = !t && e.material !== ct.coverGlass;
  document.querySelectorAll("#covers button").forEach(e => e.setAttribute("aria-pressed", String(e.dataset.cover === s))), a_()
}

function wc(s, t) {
  Zi[s].open = t;
  let e = pe(s ? "door-r" : "door-f");
  e.setAttribute("aria-pressed", String(t)), e.textContent = (t ? "Close " : "Open ") + (s ? "rear" : "front") + " door", a_()
}
var P1 = {
    iso: {
      p: [-2.9, -3.3, 2.5],
      t: [0, 0, .8]
    },
    front: {
      p: [0, -5, 1.3],
      t: [0, 0, .85]
    },
    side: {
      p: [5.2, 0, 1.3],
      t: [0, 0, .85]
    },
    top: {
      p: [0, -.02, 6],
      t: [0, 0, .8]
    },
    gantry: {
      p: [-.95, -1.95, 1.75],
      t: [-.12, -.15, .98],
      door: 0
    },
    board: {
      p: [.3, -.95, 1.13],
      t: [0, -.15, .9],
      door: 0
    },
    pickf: {
      p: [-.16, -.36, .13],
      t: [0, 0, 0],
      follow: 0,
      door: 0
    },
    pickr: {
      p: [.16, .36, .13],
      t: [0, 0, 0],
      follow: 1,
      door: 1
    }
  },
  Vo = -1,
  Sc = new R;

function Cp(s) {
  let t = P1[s];
  if (Vo = t.follow ?? -1, t.door !== void 0 && ad === "solid" && wc(t.door, !0), Vo >= 0) {
    let e = id(Vo, nd(Vo, tn));
    Sc.copy(xs(e.x, e.y, .95)), Jn.target.copy(Sc), ui.position.copy(Sc).add(xs(...t.p))
  } else ui.position.copy(xs(...t.p)), Jn.target.copy(xs(...t.t));
  Jn.update(), document.querySelectorAll("#views button").forEach(e => e.setAttribute("aria-pressed", String(e.dataset.view === s)))
}

function l_() {
  let [s, t] = Ec.size();
  !s || !t || (Ti.setSize(s, t, !1), ui.aspect = s / t, ui.updateProjectionMatrix(), Rp())
}
var tn = 0,
  rd = 0,
  Go = !0,
  Ep = .5,
  ld = dr.length;
document.querySelectorAll(".s-total").forEach(s => {
  s.textContent = "/ " + ld
});
pe("s-cycle").textContent = "board cycle " + we.toFixed(1) + " s per lane";
pe("clock-total").textContent = we.toFixed(1);
var K1 = Math.round(2 * dr.length / we * 3600);
Ec.cycle(we.toFixed(1) + " s", "per board per lane \xB7 " + dr.length + " parts \xB7 " + Math.round(2 * 3600 / we) + " boards/h on 2 lanes", "CYCLE TIME \xB7 BOARD");
pe("s-cph").textContent = Math.round(2 * ld / we * 3600).toLocaleString("en").replace(/,/g, " ");
pe("live-sub").textContent = ld + " parts / board";
var I1 = [pe("noz-f"), pe("noz-r")].map(s => Array.from({
  length: vs
}, () => s.appendChild(document.createElement("div"))));
pe("legend").innerHTML = Object.keys(Fg).map(s => `<span><i style="background:${Xg[s]}"></i>${Fg[s]}</span>`).join("");
var L1 = [0, 1].map(s => Ho.filter(t => t.head === s).sort((t, e) => t.tPlace - e.tPlace)),
  Vg = [-1, -1];

function D1(s, t) {
  if (t === Vg[s]) return;
  Vg[s] = t;
  let e = pe("map" + s),
    n = e.getContext("2d"),
    i = e.width / Fe.L;
  n.fillStyle = "#0e5a30", n.fillRect(0, 0, e.width, e.height), L1[s].forEach((r, o) => {
    let a = (r.u + Fe.L / 2 - r.hw) * i,
      l = (Fe.W / 2 - r.v - r.hh) * i,
      c = Math.max(3, r.hw * 2 * i),
      h = Math.max(3, r.hh * 2 * i);
    o < t ? (n.fillStyle = Xg[r.kind], n.fillRect(a, l, c, h), n.strokeStyle = "rgba(255,255,255,.55)", n.lineWidth = 1, n.strokeRect(a + .5, l + .5, c - 1, h - 1)) :
      (n.fillStyle = "rgba(205,187,134,.45)", n.fillRect(a, l, c, h))
  }), pe("m" + s + "-n").textContent = t + " / " + ld
}

function Rp() {
  let s = pe("lanes"),
    t = s.getBoundingClientRect(),
    e = devicePixelRatio || 1;
  if (!t.width) return;
  s.width = Math.round(t.width * e), s.height = Math.round(t.height * e);
  let n = s.getContext("2d");
  n.scale(e, e);
  let i = t.width,
    r = (t.height - 10) / 4,
    o = c => c / we * i,
    a = {
      conv: lr("--conv"),
      0: lr("--hf"),
      1: lr("--hr"),
      amber: lr("--amber"),
      line: lr("--line")
    };
  [
    [ed, "conv", 0],
    [hr[0], 0, 0],
    [ed, "conv", 1],
    [hr[1], 1, 1]
  ].forEach(([c, h, d], u) => {
    let f = 2 + u * (r + 2);
    n.globalAlpha = 1, n.fillStyle = a.line, n.fillRect(0, f + r / 2 - .5, i, 1);
    for (let p of c) {
      let _ = {
        pick: .55,
        place: 1,
        move: .22,
        scan: 1,
        in: 1,
        out: 1,
        clamp: 1,
        hold: .22
      } [p.kind];
      if (_) {
        n.globalAlpha = _, n.fillStyle = p.kind === "scan" || p.kind === "clamp" ? a.amber : a[h];
        for (let g of [bc[d], bc[d] - we]) n.fillRect(o(p.t0 + g), f, Math.max(.6, o(p.t1) - o(p.t0)), r)
      }
    }
  }), n.globalAlpha = 1
}

function cd(s) {
  Go = s, pe("play").setAttribute("aria-label", s ? "Pause" : "Play"), pe("play-icon").innerHTML = s ? '<path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z"/>' :
    '<path d="M7 4.5v15l13-7.5z"/>'
}
pe("play").addEventListener("click", () => {
  !Go && tn >= we * .999 && (tn = 0), cd(!Go)
});
pe("restart").addEventListener("click", () => {
  tn = 0, rd = 0
});
document.querySelectorAll("#speeds button").forEach(s => s.addEventListener("click", () => {
  Ep = +s.dataset.speed, document.querySelectorAll("#speeds button").forEach(t => t.setAttribute("aria-pressed", String(t === s)))
}));
document.querySelectorAll("#views button").forEach(s => s.addEventListener("click", () => Cp(s.dataset.view)));
document.querySelectorAll("#covers button").forEach(s => s.addEventListener("click", () => Ap(s.dataset.cover)));
pe("door-f").addEventListener("click", () => wc(0, !Zi[0].open));
pe("door-r").addEventListener("click", () => wc(1, !Zi[1].open));
{
  let s = pe("timeline"),
    t = !1,
    e = n => {
      let i = s.getBoundingClientRect();
      tn = Yi((n.clientX - i.left) / i.width, 0, 1) * we * .9999
    };
  s.addEventListener("pointerdown", n => {
    t = !0, s.setPointerCapture(n.pointerId), e(n)
  }), s.addEventListener("pointermove", n => {
    t && e(n)
  }), s.addEventListener("pointerup", () => {
    t = !1
  }), s.addEventListener("keydown", n => {
    n.key === "ArrowRight" && (tn = Math.min(we * .9999, tn + .1)), n.key === "ArrowLeft" && (tn = Math.max(0, tn - .1))
  })
}
addEventListener("keydown", s => {
  s.code === "Space" && !/INPUT|BUTTON/.test(s.target.tagName) && (s.preventDefault(), pe("play").click())
});
{
  let s = new yo,
    t = {
      x: 0,
      y: 0
    },
    e = Ti.domElement,
    n = i => {
      if (ad === "off") return -1;
      let r = e.getBoundingClientRect();
      s.setFromCamera(new it((i.clientX - r.left) / r.width * 2 - 1, -((i.clientY - r.top) / r.height) * 2 + 1), ui);
      let o = s.intersectObjects(Zi.flatMap(a => a.pick), !1)[0];
      return o ? Zi.findIndex(a => a.pick.includes(o.object)) : -1
    };
  e.addEventListener("pointerdown", i => {
    t.x = i.clientX, t.y = i.clientY
  }), e.addEventListener("pointerup", i => {
    if (i.button !== 0 || Math.hypot(i.clientX - t.x, i.clientY - t.y) > 5) return;
    let r = n(i);
    r >= 0 && wc(r, !Zi[r].open)
  }), e.addEventListener("pointermove", i => {
    i.buttons === 0 && (e.style.cursor = n(i) >= 0 ? "pointer" : "")
  })
}
var vp = {};

function N1() {
  let s = Ec.isDark();
  Cn.background = new bt(s ? 1053981 : 15659509);
  let t = s ? "d" : "l";
  vp[t] || (vp[t] = b1(s)), bp.map = vp[t], bp.needsUpdate = !0, Kg.color.set(s ? 2830909 : 12042185), Cn.environmentIntensity = s ? .4 : .5, Ei.intensity = s ? 1.35 :
    1.5, Jg.intensity = s ? .35 : .3, sd[0].path.material.color.set(lr("--hf")), sd[1].path.material.color.set(lr("--hr")), Rp()
}
Ec.onTheme(N1);
var Gg = {};

function Hg(s, t) {
  Gg[s] !== t && (Gg[s] = t, pe("now-" + s).textContent = t.label || "Ready", pe("cmd-" + s).textContent = t.cmd || "")
}

function U1(s) {
  let t = [nd(0, s), nd(1, s)],
    e = [id(0, t[0]), id(1, t[1])],
    n = [zg(t[0]), zg(t[1])],
    i = [0, 0],
    r = [new Array(vs).fill(!1), new Array(vs).fill(!1)];
  for (let o of [0, 1]) {
    let a = e[o],
      l = sd[o],
      c = C1[o],
      h = t[o];
    yp(c.work, n[o], o);
    let d = Yi((h - Fe.tMove - 1) / 1.2, 0, 1);
    c.queue.visible = h > Fe.tMove + 1, yp(c.queue, ur(Fe.xQ, Fe.xIn, _s(d)), o), c.done.visible = h < Fe.tMove, yp(c.done, ur(Fe.xOut, Fe.xGone, _s(Yi(h / Fe.tMove, 0,
      1))), o), l.g.position.set(a.x, a.y, 0), l.beam.position.y = a.y;
    for (let f = 0; f < vs; f++) l.noz[f].position.z = Bg(a, f);
    ct.camGlass[o].emissiveIntensity = a.seg.kind === "scan" ? 4 : .05;
    let u = pe("trail").checked && a.seg.kind !== "wait";
    l.path.visible = u, u && l.shown !== a.seg.trip && (l.shown = a.seg.trip, l.path.geometry.dispose(), l.path.geometry = new Zt().setFromPoints(l.trips[a.seg.trip])),
      Hg(o, a.seg), Hg("c" + o, Zg(ed, h)), pe(o ? "hr-trip" : "hf-trip").textContent = `trip ${a.seg.trip+1} / ${Mc}`
  }
  for (let o of Ho) {
    let a = o.mesh,
      l = o.head,
      c = t[l];
    if (c < o.tPick) a.visible = !1;
    else if (c < o.tPlace) {
      let h = e[l],
        d = zo[o.k];
      r[l][o.k] = !0, a.visible = !0, a.position.copy(xs(h.x + d[0], h.y + d[1], Bg(h, o.k) - o.h)), a.rotation.y = o.rot * _s(Yi((c - o.tPick) / (o.tPlace - o.tPick) *
        1.6, 0, 1)), sd[l].noz[o.k].rotation.z = a.rotation.y
    } else i[l]++, a.visible = !0, a.position.copy(xs(n[l] + o.u, Tc[l] + o.v, ys.pcb)), a.rotation.y = o.rot
  }
  for (let o of T1) {
    let a = t[o.h],
      l = -1;
    for (let d of o.picks)
      if (d <= a) l = d;
      else break;
    let c = l < 0 ? 1 : Yi((a - l) / .12, 0, 1),
      h = Math.sign(o.f.y);
    o.mesh.position.copy(xs(o.f.x, o.f.y + h * (1 - _s(c)) * .008, o.f.z)), o.mesh.visible = c > .15
  }
  for (let o of [0, 1]) I1[o].forEach((a, l) => {
    a.classList.toggle("full", r[o][l]), a.classList.toggle("act", e[o].seg.k === l)
  }), pe("s-p" + o).textContent = i[o], D1(o, i[o]);
  if (pe("s-out").textContent = Math.floor(rd / we) + Math.floor((rd + we - bc[1]) / we), pe("clock-now").textContent = s.toFixed(1), pe("playhead").style.left = s / we *
    100 + "%", ct.lampG.emissiveIntensity = Go ? 2.5 : 0, ct.lampY.emissiveIntensity = Go ? 0 : 2.5, Vo >= 0) {
    let o = e[Vo],
      a = xs(o.x, o.y, .95),
      l = a.clone().sub(Sc);
    ui.position.add(l), Jn.target.add(l), Sc.copy(a)
  }
}
var Wg = performance.now();

function c_(s) {
  let t = Math.min(.25, (s - Wg) / 1e3);
  Wg = s, Go && (tn += t * Ep, rd += t * Ep, tn >= we && (pe("loop").checked ? tn %= we : (tn = we * .9999, cd(!1))));
  for (let e of Zi) e.a += ((e.open ? 1 : 0) - e.a) * Math.min(1, t * 6), e.g.rotation.x = -1.25 * _s(Yi(e.a, 0, 1));
  U1(tn), Jn.update();
  {
    let e = ui.position.distanceTo(Jn.target);
    ui.near = Yi(e * .03, 1, 10), ui.updateProjectionMatrix()
  }
  Ti.render(Cn, ui), requestAnimationFrame(c_)
}
new ResizeObserver(l_).observe(y1);
new ResizeObserver(() => Rp()).observe(pe("timeline"));
l_();
Ap("solid");
Cp("iso");
cd(!0);
window.simReady = !0;
pe("load-error").style.display = "none";
window.__sim = {
  comps: Ho,
  JOB: dr,
  KIT: Zn,
  get time() {
    return tn
  },
  seek: s => {
    tn = s
  },
  setView: Cp,
  setDoor: wc,
  setCovers: Ap,
  get duration() {
    return we
  },
  pause: () => cd(!1),
  pose: s => id(s, nd(s, tn))
};
requestAnimationFrame(c_);
})();