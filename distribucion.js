/**
 * solicitar isolinea a partir del centro
 *
 * @param {H.service.Platform} platform A stub class to access HERE services
 * @param {number} time tiempo de transito
 * @param {number} lat itud
 * @param {number} lon gitud
 */
function requestAndDrawIsoline(platform, time, opacidad, lat, lon){
  var router = platform.getRoutingService();
  isolineRequestParams = {
    // app id y app code ya estan especificados en 'platform'
    mode: 'fastest;truck;traffic:enabled',
    start: 'geo!'.concat(lat).concat(",").concat(lon),
    range: time,
    rangetype: 'time'
  };
  // lo que se ejecuta cuando se reciba una respuesta
  var onSuccess = function(result) {
    // evidencia de que la query es asincrona
    shape = result.response.isoline[0].component[0].shape;
    addShapeToMap(shape, opacidad);
  }
  router.calculateIsoline(
    isolineRequestParams,
    onSuccess,
    onError
  );
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 * @param  {Object} error  The error message received.
 */
function onError(error) {
  alert('Ooops!');
}

/**
 * graficar figura recibida por el API
 * @param  {Object} shape  The error message received.
 */
function addShapeToMap(shape, opacidad) {
  var lineString = new H.geo.LineString();
  shape.forEach(function(point) {
    var parts = point.split(',');
    lineString.pushLatLngAlt(parts[0], parts[1]);
  });
  polyline = new H.map.Polyline(lineString, {
    style: {
      lineWidth: 4,
      strokeColor: 'rgba(0, 128, 255, '.concat(opacidad).concat(')')
    }
  });
  // Add the polyline to the map
  map.addObject(polyline);
  var actuales = map.getViewBounds();
  var nuevos = polyline.getBounds();

  // arreglar zoom del mapa si es necesario
  if (hay_figuras) {
    var ga = Math.min(actuales.ga,nuevos.ga);
    var ha = Math.max(actuales.ha,nuevos.ha);
    var ja = Math.min(actuales.ja,nuevos.ja);
    var ka = Math.max(actuales.ka,nuevos.ka);
    var bbox = new H.geo.Rect(ka,ga,ja,ha);
    map.setViewBounds(bbox, false);
  }
  else {
    // si es la primera figura, usamos sus bordes para el mapa
    map.setViewBounds(nuevos, false);
  }
  hay_figuras = true;
}
/**
 * Boilerplate map initialization code starts below:
 */

//Step 1: initialize communication with the platform
var platform = new H.service.Platform({
  app_id: '8lLGvkJ2IAfVyqVjZyD8',
  app_code: 'MPDGpNj9sfBDMNRzpe2nXg',
  useHTTPS: true
});
var pixelRatio = window.devicePixelRatio || 1;
var defaultLayers = platform.createDefaultLayers({
  tileSize: pixelRatio === 1 ? 256 : 512,
  ppi: pixelRatio === 1 ? undefined : 320
});

//Step 2: initialize a map  - not specificing a location will give a whole world view.
var map = new H.Map(document.getElementById('map'),
  defaultLayers.normal.map, {pixelRatio: pixelRatio});

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

// ya hemos dibujado algo?
var hay_figuras = false;
// tiempos para isolineas
var tiempos = [5*60,10*60];
var opacidades = [1,0.7];

// solicitar y dibujar isolineas
d3.csv("/puntos.csv").then(function(data) {
  for (i=0; i<data.length; i++) {
    lat = data[i].lat;
    lon = data[i].lon;
    for (t=0; t<tiempos.length; t++) {
      requestAndDrawIsoline(platform,tiempos[t], opacidades[t],lat,lon);
    }
  }
});