Array.prototype.slot = (b, mapper)=>{
  const q = this;
  let i = 0;
  return q.map((q_j, j)=>{
    while (i < b.length && b[i] <= q_j)
      i += 1;
    if (i == 0) 
      return mapper(undefined);
    return mapper(i - 1);
  })
}
Array.prototype.slide = function*(n){
  for(let i = 0; i < this.length - n + 1; i++){
    yield this.slice(i, i+n);
  }
  return null;
}

Array.prototype.last = function(){
  return this[this.length -1]
}

Array.prototype.merge = function(boundary, postprocess = (arr)=>[arr[0],arr.last()]){
  const merged = this.push(boundary).sort((a, b)=> b.e[1] - a.e[1])
  return postprocess(merged);
}

Array.prototype.bsearch = function(target, compareFn = (a, b) => a - b) {
  let left = 0;
  let right = this.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const comparison = compareFn(this[mid], target);
    
    if (this.length == 1){
      if (comparison)
        return 0;
      return -1
    }

    if (comparison){
      return mid;
    }else if (target[1] < this[mid]){
      right = mid - 1; // 左半分を探索
    }else{
      left = mid + 1; // 右半分を探索
    }
  }
  return -1
}

class SVGCanvas{
  constructor(id, points, aspect = 1){
    const tLons = points.map((point)=>point[0]);
    const tLats = points.map((point)=>point[1]);
    this.minLon = this.min(tLons);
    this.maxLon = this.max(tLons);
    this.minLat = this.min(tLats);
    this.maxLat = this.max(tLats);
    this.width = document.getElementById(id).getAttribute("width") - 0;
    this.height= aspect * this.width;
    document.getElementById(id).setAttribute("height", Math.round(this.height));
    document.getElementById("addSegment").addEventListener("click", SVGCanvas.addSegment)
  }
  min(ary){ return ary.reduce((a, b)=>Math.min(a,b))}
  max(ary){ return ary.reduce((a, b)=>Math.max(a,b))}
  toSvgCoord([lon, lat]){
    return [
    ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.width,
    this.height - ((lat - this.minLat) / (this.maxLat - this.minLat)) * this.height
    ]
  }
  toSvg(pList){
    return pList.map((point, i)=>{
      return this.toSvgCoord(point)
    })
  }
  toSvgPath(pList){
    const first = pList[0];
    const last  = pList[pList.length-1];
    return pList.map((point, i)=>{
      const [lon, lat] = point;
      const prefix = i < 1 ? "M" : "L"
      return prefix + lon + " " + lat;
    }).join(" ") + (first[0]==last[0]&&first[1]==last[1] ? " Z": "")

  }
  drawPolyline(id, polyline){
    const svgCoord = this.toSvg(polyline);
    document.getElementById(id).setAttribute("d", this.toSvgPath(svgCoord));
  }
  attach(prop, data){
    this[prop] = data;
    this.segmentsIter = this.segmentList()
    this.rings = [];
  }
  *segmentList(){
    for(let segment of this.segments){
      yield segment
    }
  }
  bsearch(segment){
    if(this.rings.length < 1)
      return -1;

    return -1;
  }
  addRing(segment){
    const ring = {lower: [segment], upper: []}
    this.rings.unshift(ring);
  }
  appendRing(i, segment){
    const ring = {lower: [segment], upper: []};
    this.rings.splice(i, 0, ring);
  }
  prependRing(i, segment){
    const ring = {lower: [segment], upper: []};
    if(i > 0){
      this.rings.splice(i - 1, 0, ring);
    }else{
      this.rings.unshift(ring);
    }
  }
  extendRing(i, value){
    const ring = this.rings[i];

  }
  static addSegment(evt){
    const {value, done} = svg.segmentIter.next();
    const segments = [];
    segments.push(value.s, value.e);
    const segment = svg.toSvg(segments);
    const sweepline = segment[value.length < 2 ? 0 : 1][0];
    document.getElementById("segment").setAttribute("d", svg.toSvgPath(segment));
    document.getElementById("sweepline").textContent = sweepline.toFixed(3);


    // 線分の始点のy値で要素列の終端を二分探索
    const j = this.bsearch_interval(value);
    if (j < 0){
      this.addRing(value)
    }else{
      // もし、線分の始点が、要素列の終点のどれかに一致するならそこに加える
      const ring = this.rings[j];
      if(ring.lower.last().e[0] == value.s[0] && ring.lower.last().e[1] == value.s[1]){
        ring.lower.push(value);
        // 付け加えた後、接続チェック
      }else if(ring.lower[0].s[0] == value.s[0] && ring.lower[0].s[1] == value.s[1]){
        // 終点が一致せずに始点が一致する場合、
        // リングを拡張する
        this.extendRing(i, value);
      }else if (ring.upper.length < 1) {
        // 終点も始点も一致しない時でまだリングが単一の時、加える線分始点のy値が大きければappend
        // 加える線分始点のy値が小さければprepend
        if (ring.lower.s[1] < value.s[1]){
          this.appendRing(i, value);
        }else{
          this.prependRing(i, value);
        }
      }else if(ring.upper.last().e[0] == value.s[0] && ring.upper.last().e[1] == value.s[1]){
        // 線分の終点が一致していれば
        ring.upper.push(value)
      }else if(ring.upper.last().s[0] < value.s[0]){
        // リングの上端線の終端よりも大きければ新たなリングを追加
        this.appendRing(i, value);
      }else {
        // それ以外は、二股に別れる時
        if(ring.lower.last().s[0] == value.s[0] && ring.lower.last().s[1] == value.s[1]){
          // リング下端なら、線分の終端y値が小さい方と入れ替える
          if (ring.lower.last().e[1] > value.e[1]){
            ring.lower[ring.lower.length -1 ] = value;
          }else{
            console.log("noneed", value)
          }
        }else if (ring.upper.last().s[0] == value.s[0] && ring.upper.last().s[1] == value.s[1]){
          // リング上端なら、線分の終端y値が大きい方と入れ替える
          if (ring.upper.last().e[1] < value.e[1]){
            ring.lower[ring.upper.length -1] = value;
          }else{
            console.log("noneed", value)
          }
        }else{
          // それ以外は例外
          console.log("except", value);
        }
      }
    }
    // 加える線分の始点がprofilesに含まれる要素列の終点に一致するものを探す
    // もしないならば、profilesにあらたな要素列として加える
    // 　加える時は、線分のy値降順で大きいものをupperに、小さいものをlowerとして構成する
    // もし存在するならその要素列と結合する
    const path = this.rings.map((ring)=>{
      const path = ring.lower.concat(ring.upper.map((segment)=>{
        const {s, e} = segment;
        return {s: e, e: s};
      }).reverse());
      path.push(path[0]);
      return path.flat(1);
    })
    document.getElementById("profile").setAttribute("d", svg.toSvgPath(svg.toSvg(path)));


  }
}

var svg = null;

fetch('./N03-21_44_210101.geojson')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(geojson => {
    const feature = geojson.features[0];
    console.log(feature)
    // 1. ここで処理を書く
    document.getElementById("json").textContent = JSON.stringify(feature.geometry, null, 2);
    
    const pointList = feature.geometry.coordinates[0]; 
    //console.log([...pointList.slide(2)]);

    const features = geojson.features;
    const pointsList = features.map((feature)=>{
      return feature.geometry.coordinates[0];
    })
    const points = pointsList.flat(1);

    // 2. 最大・最小を求める
    const lons = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    // const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    // const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const min = function (ary){ return ary.reduce((a, b)=>Math.min(a,b))}
    const max = function (ary){ return ary.reduce((a, b)=>Math.max(a,b))}

    let minLon = min(lons), maxLon = max(lons);
    let minLat = min(lats), maxLat = max(lats);

    // 3. 描画するSVG/Canvasのサイズ
    // const width = 200, height = 200;
    const width = document.getElementById("profile").getAttribute("width") - 0;
    let height = document.getElementById("profile").getAttribute("height") -0;
    const aspect = (maxLat - minLat) / (maxLon - minLon);

    // 4. 緯度経度→SVG座標変換関数
    const toSvgCoord = ([lon, lat]) => {
      const height = aspect * width;
      return [
      ((lon - minLon) / (maxLon - minLon)) * width,
      height - ((lat - minLat) / (maxLat - minLat)) * height
      ]
    }
    const pieces = pointsList.map((pList)=>{
      return pList.map((point, i)=>{
        const [long, lat] = toSvgCoord(point);
        const prefix = i < 1 ? "M" : "L"
        return prefix + long + " " + lat;
      }).join(" ")
    })

    let aligned = pointsList.map((pList)=>{
      const lons = pList.map(p => p[0]);
      const minLon = min(lons), maxLon = max(lons);
      // pointsをminLonから順番に並べ替える
      // minLonを持つ要素から最後までを抽出
      const minLonIndex = pList.findIndex((point)=>point[0] == minLon);
      const spliced = pList.slice(minLonIndex).concat(pList.slice(1, minLonIndex));
      spliced.push(spliced[0]);
      return spliced;
    })


    // 経度順に並べ変える
    aligned = aligned.sort((aList,bList)=>{
      const a = aList[0][0], b = bList[0][0];
      return a - b;
    })

    svg = new SVGCanvas("prefecture", aligned[0], aspect);
    svg.drawPolyline("polyline", aligned[0]);

    // 線分化
    const segmentsList = aligned.reduce((segments, pList, i)=>{
      if (i > 0)
        return segments;

      for (let [s, e] of pList.slide(2)){
        if (s[0] > e[0])
          segments.push({s: e, e: s});
        else
          segments.push({s, e})
        
      }
      return segments;
    }, [])
    console.log("aligned:整頓済 ", aligned.length);
    console.log("segmentsList: ", segmentsList.length);

    let segments = segmentsList.flat(1);
    segments = segments.sort((a,b)=>{
      return a.s[0] - b.s[0]
    })
    console.log("線分数", segments.length, segments)
    
    document.getElementById("json").textContent = JSON.stringify(pointList, null, 2);

    let profile = "M10 10 L60 80 L120 20 L180 90 Z"
    profile = pieces.join(" ") + " Z"
    document.getElementById('output').setAttribute("d", profile);
    document.getElementById("profile").setAttribute("height", Math.round(aspect*width));

    //外周抽出
    svg.attach("segments", segments);    
    const polylines = segments;
    // ポリラインを結合    
    /*
    const profiles = polylines.reduce((profiles, polyline)=>{
      if(profiles.length < 1){
        profiles.push({upper:[polyline[0]], lower:[polyline[1]]})
        return profiles
      }
      if(polyline.length < 2) {
        const {s, e} = polyline[0]
        const [slng, slat] = s;
//        const profile_i = profiles.findIndex((profile)=>{
//          const {upper, lower} = profile;
//          const [uelng, uelat] = upper[upper.length - 1].e;
//          const [lelng, lelat] = lower[lower.length - 1].e;
//          return uelng == slng && uelat == slat || lelng == slng && lelat == slat
//        })
        const profile_i = profiles.bsearch(s, (profile, target)=>{
          const {upper, lower} = profile;
          const [uelng, uelat] = upper[upper.length - 1].e;
          const [lelng, lelat] = lower[lower.length - 1].e;
          return uelng == target[0] && uelat == target[1] || lelng == target[0] && lelat == target[1]
        })
        if(profile_i > -1){
          const {upper, lower} = profiles[profile_i];
          const [uelng, uelat] = upper[upper.length - 1].e;
          const [lelng, lelat] = lower[lower.length - 1].e;
          if(uelng == slng && uelat == slat){
            upper.push(polyline[0])
          }else if(lelng == slng && lelat == slat){
            lower.push(polyline[0])
          }
        }
        return profiles;  
      }
      const {s, e} = polyline[0]
      const [slng, slat] = s;
      const profile_i = profiles.bsearch(s, (profile, target)=>{
        const {upper, lower} = profile;
        const [uelng, uelat] = upper[upper.length - 1].e;
        const [lelng, lelat] = lower[lower.length - 1].e;
        return uelng == slng && uelat == slat || lelng == slng && lelat == slat
      })
      if(profile_i > -1){
        const {upper, lower} = profiles[profile_i];
        const [uelng, uelat] = upper[upper.length - 1].e;
        const [lelng, lelat] = lower[lower.length - 1].e;
        if(uelng == slng && uelat == slat){
          upper.push(polyline[0])
        }else if(lelng == slng && lelat == slat){
          lower.push(polyline[1])
        }
      }else{
        const profile_i= profiles.findIndex((profile)=>{
          const {upper, lower} = profile;
          const [uelng, uelat] = upper[upper.length - 1].e;
          return slat < uelat 
        })
        if(profile_i > -1){
          profiles.splice(profile_i, 0, {upper:[polyline[0]], lower:[polyline[1]]})
        }else{
          profiles.unshift({upper:[polyline[0]], lower:[polyline[1]]})
        }
      }
      return profiles;
    },[])

    segments = profiles.map((profile)=>{
      const arr = profile.lower.concat(profile.upper.map((segment)=>{
        const {s, e} = segment;
        return {s: e, e: s}
      }).reverse())
      arr.push(arr[0])
      return arr.flat(1);
    });

    const targets = segments.flat(1).map((segment)=>segment.s);
    const tLons = targets.map((point)=>point[0]);
    const tLats = targets.map((point)=>point[1]);
    minLon = min(tLons);
    maxLon = max(tLons);
    minLat = min(tLats);
    maxLat = max(tLats);


    let prefecture = segments.map((segmentList)=>{
      return segmentList.map((segment)=>segment.s).map((point, i)=>{
        const [lng, lat] = toSvgCoord(point);
        const prefix = i < 1 ? "M" : "L"
        return prefix + lng + " " + lat;
      }).join(" ")
    }).join(" ");
    */
   let prefecture = "";
    document.getElementById('oita').setAttribute("d", prefecture);
  })
  .catch(error => {
    console.error('取得エラー:', error);
  });