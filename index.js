fetch('./N03-21_44_210101.geojson')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(async (geojson) => {
    let cityOfficeLocations = await (await fetch('./r0612puboffice_utf8.csv')).text();
    cityOfficeLocations = cityOfficeLocations.split("\n");

    console.log((cityOfficeLocations[0]))
    cityOfficeLocations = cityOfficeLocations.map((cityOffice)=>{
      return cityOffice.split("\t");
    })
    console.log((cityOfficeLocations[0]))

    cityOfficeLocations = cityOfficeLocations.filter((cityOffice)=>{
      // return cityOffice[1] == "大分県"
      return cityOffice[0].startsWith("44") && cityOffice[0].length > 4
    })
    console.log((cityOfficeLocations))
    const  cityOffice = cityOfficeLocations[Math.floor(Math.random()*cityOfficeLocations.length)];

    const feature = geojson.features[0];
    console.log(feature)
    // 1. ここで処理を書く
    document.getElementById("json").textContent = JSON.stringify(feature.geometry, null, 2);
    
    const pointList = feature.geometry.coordinates[0]; 

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
    const height = document.getElementById("profile").getAttribute("height") -0;
    const aspect = (maxLat - minLat) / (maxLon - minLon);

    // 4. 緯度経度→SVG座標変換関数
    const toSvgCoord = ([lon, lat]) => [
      ((lon - minLon) / (maxLon - minLon)) * width,
      aspect*width - ((lat - minLat) / (maxLat - minLat)) * aspect * width
    ];

    const pieces = pointsList.map((pList)=>{
      return pList.map((point, i)=>{
        const [long, lat] = toSvgCoord(point);
        const prefix = i < 1 ? "M" : "L"
        return prefix + long + " " + lat;
      }).join(" ")
    })
    document.getElementById("profile").setAttribute("height", Math.round(aspect*width));
    document.getElementById("json").textContent = JSON.stringify(pointList, null, 2);

    let profile = "M10 10 L60 80 L120 20 L180 90 Z"
    profile = pieces.join(" ") + " Z"
    document.getElementById('output').setAttribute("d", profile);

    //let cx = cityOffice[9];
    //let cy = cityOffice[8];
    let [cx, cy] = toSvgCoord([cityOffice[9]-0, cityOffice[8]-0]);
    document.getElementById("profile").children[0].setAttribute("cx", cx);
    document.getElementById("profile").children[0].setAttribute("cy", cy);

  })
  .catch(error => {
    console.error('取得エラー:', error);
  });