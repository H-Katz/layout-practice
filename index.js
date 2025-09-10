

class SVGCanvas{
  constructor(id){
    this.id = id;
    this.root = document.getElementById(id);
  }
  load(filename){
    return fetch(filename).then((response)=>response.json())
    .then(geojson=>{
      const features = geojson.features;
      const polylines = features.map((feature)=>{
        return feature.geometry.coordinates[0];
      })

      const points = polylines.flat(1); 
       // 2. 最大・最小を求める
      // const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      // const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const lons = points.map((point)=>point[0]);
      const lats = points.map((point)=>point[1]);      
      this.minLon = this.min(lons);
      this.maxLon = this.max(lons);
      this.minLat = this.min(lats);
      this.maxLat = this.max(lats);

       // 3. 描画するSVG/Canvasのサイズを調整 
      const aspect = (this.maxLat - this.minLat) / (this.maxLon - this.minLon);
      this.width = this.root.getAttribute("width") - 0;
      this.height= aspect * this.width;

      this.root.setAttribute("height", Math.round(this.height));

      // 4. 緯度経度→SVG座標変換
      const svgCoordPolylines = this.toCanvasCoordFromPolylines(polylines);
      const profile = svgCoordPolylines.map((polyline)=>this.toPath(polyline)).join(" ");

      const pathNode = this.root.querySelector("path");
      pathNode.setAttribute("d", profile);
    })
  }
  min(ary){ return ary.reduce((a, b)=>Math.min(a,b))}
  max(ary){ return ary.reduce((a, b)=>Math.max(a,b))}

  toCanvasCoordFromPolylines(polylines){
    return polylines.map((polyline)=>this.toCanvasCoordFromPolyline(polyline));
  }
  toCanvasCoordFromPolyline(polyline){
    return polyline.map((point) =>this.toCanvasCoordFromPoint(point));
  }
  toCanvasCoordFromPoint([lon, lat]){
    return [
    ((lon - this.minLon) / (this.maxLon - this.minLon)) * this.width,
    this.height - ((lat - this.minLat) / (this.maxLat - this.minLat)) * this.height
    ]
  }
  toPath(polyline){
    const first = polyline[0];
    const last  = polyline[polyline.length-1];
    return polyline.map((point, i)=>{
      const [lon, lat] = point;
      const prefix = i < 1 ? "M" : "L"
      return prefix + lon + " " + lat;
    }).join(" ") + (first[0]==last[0]&&first[1]==last[1] ? " Z": "")
  }

}

var svg = new SVGCanvas("profile");
svg.load("./N03-21_44_210101.geojson")

var cityOfficeLocations = null;

fetch('./r0612puboffice_utf8.csv')
  .then(response => response.text())
  .then(text =>{
    cityOfficeLocations = text;
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
  })

var controller = {
    nextLocation: (evt)=>{
      const  cityOffice = cityOfficeLocations[Math.floor(Math.random()*cityOfficeLocations.length)];
      let lng = cityOffice[9] - 0;
      let lat = cityOffice[8] - 0;
      let [cx, cy] = svg.toCanvasCoordFromPoint([lng, lat]);
      document.getElementById("profile").children[0].setAttribute("cx", cx);
      document.getElementById("profile").children[0].setAttribute("cy", cy);
  
    }
}