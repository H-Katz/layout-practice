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
    const minLon = min(lons), maxLon = max(lons);
    const minLat = min(lats), maxLat = max(lats);

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
    const segmentsList = pointsList.map((pList)=>{
      const arr = []
      for (let [s, e] of pList.slide(2)){
        if (s[0] > e[0])
          arr.push({s: e, e: s});
        else
          arr.push({s, e})
      }
      return arr;
    })
    let segments = segmentsList.flat(1);
    segments = segments.sort((a,b)=>{
      return a.s[0] - b.s[0]
    })
    
    document.getElementById("json").textContent = JSON.stringify(pointList, null, 2);

    let profile = "M10 10 L60 80 L120 20 L180 90 Z"
    profile = pieces.join(" ") + " Z"
    document.getElementById('output').setAttribute("d", profile);
    document.getElementById("profile").setAttribute("height", Math.round(aspect*width));

    //外周抽出
    segments = segments.reduce((profiles, segment)=>{
      if(profiles.segment == null){
        profiles.segment = segment;
        return profiles
      }else{
        const {s, e} = profiles.segment
        const [slng, slat] = s;
        const [elng, elat] = e;
        if(slng == segment.s[0] && slat == segment.s[1]){
          if(profiles.branch == null){
            if(elat > segment.e[1]){
              profiles.branch = segment
            }else{
              profiles.branch = profiles.segment
              profiles.segment= segment
            }
          }else{
            if (segment.e[1] > elat){
              profiles.segment = segment
            }else if (profiles.branch.e[1] > segment.e[1]){
              profiles.branch = segment;
            }
          }
        }else{
          if(profiles.branch == null){
            profiles.polylines.push([profiles.segment]);
            profiles.segment = null;
          }else{
            profiles.polylines.push([profiles.segment, profiles.branch]);
            profiles.segment = null;          
            profiles.branch = null;
          }
        }
      }
      return profiles;
    }, {segment: null, branch: null, polylines:[]})

    segments = segments.polylines.reduce((profiles, polyline)=>{
      if(profiles.length < 1){
        profiles.push(polyline)
        return profiles
      }
      if(polyline.length < 2) {
        const {s, e} = polyline[0]
        const [slng, slat] = s;
        
      }

      return profiles;
    },[])

    let prefecture = segments.map((segment)=>segment.s).map((point, i)=>{
        const [lng, lat] = toSvgCoord(point);
        const prefix = i < 1 ? "M" : "L"
        return prefix + lng + " " + lat;
    }).join(" ")
    
    document.getElementById('oita').setAttribute("d", prefecture);
    document.getElementById("prefecture").setAttribute("width", width);
    document.getElementById("prefecture").setAttribute("height", Math.round(aspect*width));
  })
  .catch(error => {
    console.error('取得エラー:', error);
  });