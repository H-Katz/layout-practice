

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
var cities = null;

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

    /*
    cities = cityOfficeLocations.reduce((cityList, city)=>{
      let value = city[0]; 
      let name = city[8];
      cityList[value] = name;
      return cityList;
    }, {})*/
  })

var controller = {
    nextLocation: (evt)=>{
      evt.preventDefault();
      const i = Math.floor(Math.random()*cityOfficeLocations.length);
      controller.updateLocation(i);
      document.forms.$cities.oita.value = cityOfficeLocations[i][0];
    },
    updateLocation: (i)=>{
      const  cityOffice = cityOfficeLocations[i];
      let lng = cityOffice[9] - 0;
      let lat = cityOffice[8] - 0;
      let [cx, cy] = svg.toCanvasCoordFromPoint([lng, lat]);
      const circle = svg.root.querySelector("circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy); 
    }
}

var pickCity = (evt)=>{
  const key = document.forms.$cities.oita.value;
  const i = cityOfficeLocations.findIndex((city)=>city[0] == key);
  if(i > -1){
    controller.updateLocation(i);
  }
}

var toggle = (evt)=>{
  const checked = document.forms.$cities.toggleList.checked;
  const toggleNode = document.querySelector("ul:has(input[name='oita'])");
  toggleNode.classList.toggle("filter", !checked);
}

// 大分県の18自治体データ
cities = {"44000": "大分県",
  "44201": "大分市", 
  "44202": "別府市", 
  "44203": "中津市", 
  "44204": "日田市", 
  "44205": "佐伯市",
  "44206": "臼杵市", 
  "44207": "津久見市", 
  "44208": "竹田市", 
  "44209": "豊後高田市", 
  "44210": "杵築市",
  "44211": "宇佐市", 
  "44212": "豊後大野市", 
  "44213": "由布市", 
  "44214": "国東市",
  "44322": "姫島村", 
  "44341": "日出町", 
  "44461": "九重町", 
  "44462": "玖珠町"
};
/* 
// 配列からリストを生成 ... 1対1の時は ... ?
const list = Object.entries(cities).map(([value, name])=>{
  const li = document.createElement("li");
  li.innerHTML = '<label><input type="radio" name="oita" value="'+value+'" onchange="pickCity(event)">'+name+'</label>'
  return li;
});

// 配列をある一つの要素にするには...? 集約機能だからreduce を使う
const ul = document.createElement('ul');
ul.classList.add("filter");
list.reduce((root, li)=>{
	root.append(li);
	return root;
}, ul);

// ulを加える。どこに？ <h2>自治体</h2>の弟ノードにしたい
let base = document.querySelector("aside h2:last-child");
base.parentNode.appendChild(ul);

*/