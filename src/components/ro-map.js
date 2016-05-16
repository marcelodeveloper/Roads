(function () {

    xtag.register('ro-map', {
        lifecycle: {
            created: function () {
                Ro = Ro || {};
                Ro.Session = Ro.Session || {};
                Ro.Session.Map = Ro.Session.Map || {};
            },
            inserted: function () {

                if (!this.querySelector ('ro-map-canvas') && this.querySelector ('ro-layer')) {
                    this.parse();
                }

            },
            removed: function () {
            }
        },
        events: {
            reveal: function () {
            }
        },
        accessors: {},
        methods: {

            parse: function () {

                this.parseLayers();

                this.map = document.createElement('ro-map-canvas');
                this.appendChild(this.map);

                if (this.getAttribute('layerGroup')) {
                    this.createLayerGroup();
                }

                this.crs             = this.getAttribute('projection') || "EPSG:3857";

                var initialLatitude  = this.getAttribute('latitude') || "0";
                var initialLongitude = this.getAttribute('longitude') || "0";
                var initialZoom      = this.getAttribute('zoom') || "1";
                var maxZoom          = this.getAttribute('maxZoom') || "22";
                var minZoom          = this.getAttribute('minZoom') || "1";
                var center           = [parseFloat(initialLongitude), parseFloat(initialLatitude)];
                var viewOpt          = {
                    center: center,
                    projection: this.crs,
                    zoom: parseInt(initialZoom),
                    maxZoom: parseInt(maxZoom),
                    minZoom: parseInt(minZoom)
                };

                if (this.crs !== 'EPSG:3857') {
                    viewOpt.projection = this.crs;
                }

                this.olMap = new ol.Map({
                    layers: this.olLayers,
                    target: this.map,
                    renderer: 'canvas',
                    pixelRatio: 1,
                    view: new ol.View(viewOpt)
                });

            },

            parseLayers: function () {

                this.olLayers = [];

                if (!this.roLayers) {
                    this.roLayers = this.querySelectorAll('ro-layer');
                } else {
                    this.innerHTML = '';
                }

                for (var i = 0; i < this.roLayers.length; i++) {
                    this.olLayers.push (this.layerBuilder (this.roLayers[i]));
                }

            },

            layerBuilder: function (layer) {

                var type       = layer.getAttribute('source') || 'OSM';
                var imagerySet = layer.getAttribute('imagerySet') || '';
                var visible    = (layer.getAttribute('visible')) ? true : false;
                var url        = layer.getAttribute('url') || '';
                var format     = layer.getAttribute('format') || 'image/png8';
                var layersName = layer.getAttribute('layers') || '';
                var serverType = layer.getAttribute('servertype') || 'geoserver';
                var tileSize   = layer.getAttribute('tilesize') || '512';
                var CQL_FILTER = layer.getAttribute('CQL_FILTER') || '';
                var version    = layer.getAttribute('version') || '1.1.1';
                var resultLayer;

                switch (type) {
                    case 'OSM':
                        return new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            visible: visible
                        });
                        break;
                    case 'Bing':
                        return new ol.layer.Tile({
                            source: new ol.source.BingMaps({
                                key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
                                imagerySet: imagerySet,
                                visible: visible
                            })
                        });
                        break;
                    case 'Google':

                        this.layerCrs = 'EPSG:3857';

                        return new ol.layer.Tile({
                            source: new ol.source.OSM({
                                url: this.googleURLSwich(imagerySet)
                            })
                        });

                        break;
                    case 'WMS':

                        var projection       = ol.proj.get('EPSG:4326');
                        var projectionExtent = projection.getExtent();
                        var resolutions      = new Array(16);
                        var maxResolution    = ol.extent.getWidth(projectionExtent) / (parseInt(tileSize));

                        var z;
                        for (z = 0; z < 16; ++z) {
                            resolutions[z] = maxResolution / Math.pow(2, z);
                        }

                        this.layerCrs = 'EPSG:4326';

                        var params = {
                            LAYERS: layersName,
                            FORMAT: format,
                            TRANSPARENT: 'true',
                            VERSION: version,
                            FORMAT_OPTIONS: '',
                            TILED: true
                        };

                        if (CQL_FILTER) {
                            params.CQL_FILTER = CQL_FILTER;
                        }

                        resultLayer = new ol.layer.Tile({
                            source: new ol.source.TileWMS({
                                url: url,
                                params: params,
                                serverType: serverType
                            })
                        });

                        return resultLayer;

                    default:
                        return new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            resolutions: resolutions,
                            visible: visible
                        });
                }
            },

            googleURLSwich: function (imagerySet) {
                switch (imagerySet) {
                    case 'streets':
                        return 'http://mt1.google.com/vt/lyrs=m@146&hl=en&x={x}&y={y}&z={z}';
                    case 'traffic':
                        return 'http://mt1.googleapis.com/vt?lyrs=m@226070730,traffic&src=apiv3&hl=en-US&x={x}&y={y}&z={z}&apistyle=s.t:49|s.e:g|p.h:#ff0022|p.s:60|p.l:-20,s.t:50|p.h:#2200ff|p.l:-40|p.v:simplified|p.s:30,s.t:51|p.h:#f6ff00|p.s:50|p.g:0.7|p.v:simplified,s.t:6|s.e:g|p.s:40|p.l:40,s.t:49|s.e:l|p.v:on|p.s:98,s.t:19|s.e:l|p.h:#0022ff|p.s:50|p.l:-10|p.g:0.9,s.t:65|s.e:g|p.h:#ff0000|p.v:on|p.l:-70&style=59,37|smartmaps';
                    case 'bicycling':
                        return 'http://mt1.google.com/vt/lyrs=m@121,bike&hl=en&x={x}&y={y}&z={z}';
                    case 'transit':
                        return 'http://mt1.google.com/vt/lyrs=m@121,transit|vm:1&hl=en&opts=r&x={x}&y={y}&z={z}';
                    case 'aerialLand':
                        return 'https://khms0.googleapis.com/kh?v=142&hl=en-US&x={x}&y={y}&z={z}';
                    case 'aerielStreets':
                        return 'https://mts1.google.com/vt/lyrs=h@245180971&hl=pt-BR&src=app&x={x}&y={y}&z={z}&s=Galileo';
                    default:
                        return 'http://mt1.google.com/vt/lyrs=m@146&hl=en&x={x}&y={y}&z={z}';
                }
            },

            showLayer: function (index) {

                for (var i = 0; i < this.olLayers.length; i++) {
                    this.olLayers[i].setVisible(false);
                }

                this.olLayers[index].setVisible(true);
            },

            createLayerGroup: function () {

                this.layerGroup = document.createElement('ro-map-layer-group');
                this.layerGroup.setAttribute('visible', 'false');

                for (var i = 0; i < this.olLayers.length; i++) {
                    var layerItem = document.createElement('ro-item');
                    layerItem.innerHTML = this.roLayers[i].getAttribute('label');
                    layerItem.addEventListener('click', this.showLayer.bind(this, i));
                    this.layerGroup.appendChild(layerItem);
                }

                this.layerGroup.addEventListener('click', this.toggleLayerGroup.bind(this));

                this.appendChild(this.layerGroup);

            },

            toggleLayerGroup: function () {

                if (this.layerGroup.getAttribute('visible') === 'true') {
                    this.hideLayerGroup();
                } else {
                    this.showLayerGroup();
                }

            },

            showLayerGroup: function () {
                this.layerGroup.setAttribute('visible', true);
            },

            hideLayerGroup: function () {
                this.layerGroup.setAttribute('visible', false);
            },

            setCenter: function (position) {

                var view   = this.olMap.getView();
                var latlng = this.convertProjection (position);

                view.setCenter(latlng);

            },

            setZoom: function (zoom) {

                var view = this.olMap.getView();
                view.setZoom(zoom);

            },

            convertProjection: function (coordinates)  {

                if (this.layerCrs && this.crs !== this.layerCrs) {
                    var ll = ol.proj.transform (
                        [coordinates.longitude, coordinates.latitude], this.crs, this.layerCrs
                    );
                } else {
                    ll = [coordinates.longitude, coordinates.latitude];
                }

                return ll;

            },

            addMarker: function (position, markerContent) {

                if (position.longitude && position.latitude && this.olMap) {

                    var markerEl = document.createElement('div');
                    var ll = this.convertProjection (position);

                    markerEl.className = 'roMarker';

                    if (markerContent) {
                        markerEl.appendChild(markerContent);
                    }

                    var marker = new ol.Overlay({
                        element: markerEl,
                        positioning: 'buttom-left',
                        stopEvent: false
                    });

                    marker.setPosition(ll);

                    this.olMap.addOverlay(marker);

                } else {
                    console.log('latitude and longitude are mandatory');
                }

            },

            addMarkers: function () {

            },

            markerFocus: function (position) {

                var focusEl = document.createElement('div');
                var ll = this.convertProjection (position);

                var marker = new ol.Overlay({
                    element: focusEl,
                    positioning: 'buttom-left',
                    stopEvent: false
                });

                var callbackToTimeout = (function (scope, marker) {
                    return function () {
                        scope.olMap.removeOverlay(marker);
                    };
                }(this, marker));

                if (Ro.Session.Map.timeOutMarkerFocus) {
                    this.olMap.removeOverlay(Ro.Session.Map.previousMarkerFocused);
                    clearTimeout(Ro.Session.Map.timeOutMarkerFocus);
                    Ro.Session.Map.timeOutMarkerFocus = null;
                    Ro.Session.Map.previousMarkerFocused = null;
                }

                focusEl.className = 'focusMaker';
                marker.setPosition(ll);
                this.olMap.addOverlay(marker);
                Ro.Session.Map.previousMarkerFocused = marker;
                Ro.Session.Map.timeOutMarkerFocus = setTimeout(callbackToTimeout, 1000);

            },

            /* Get map features and focuses them */

            fitToBound: function () {

                var o = this.olMap.getOverlays();
                var v = this.olMap.getView();
                var a = o.getArray();
                var p = [];

                for (var i = 0, l = a.length; i < l; i++) {
                    if (a[i].getPosition() && !a[i].currentPosition) {
                        p.push(a[i].getPosition())
                    }
                }

                if (p.length) {
                    var l = p[0][1],
                        r = p[0][1],
                        t = p[0][0],
                        b = p[0][0];

                    for (var i = 0, pl = p.length; i < pl; i++) {

                        if (l < p[i][1]) {
                            l = p[i][1];
                        }
                        if (r > p[i][1]) {
                            r = p[i][1];
                        }
                        if (t < p[i][0]) {
                            t = p[i][0]
                        }
                        if (b > p[i][0]) {
                            b = p[i][0];
                        }
                    }

                    featureMultiLine = new ol.Feature();

                    var ml = new ol.geom.LineString([
                        [b, l],
                        [t, l],
                        [t, r],
                        [b, r]
                    ]);

                    v.fitExtent(ml.getExtent(), this.olMap.getSize());
                }

            },

            clear: function () {

                if (this.olMap) {
                    var overlays = this.olMap.getOverlays().getArray();
                    var map = this.olMap;

                    for (var l = overlays.length; l > 0; l--) {

                        if (overlays[l - 1] && !overlays[l - 1].currentPosition) {
                            map.removeOverlay(overlays[l - 1]);
                        }
                    }
                }

            },

            getOLMap: function () {
                return this.olMap;
            }
        }
    });

})();