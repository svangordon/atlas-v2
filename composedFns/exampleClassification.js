// var geometry = /* color: #0b4a8b */ee.Geometry.Polygon(
//         [[[-0.05494581838740942, 14.461468759652071],
//           [0.6012522759381227, 14.365700752462468],
//           [0.6012455827112717, 14.875706068039074],
//           [-0.03270576072179665, 14.907523636434911]]]);

var classificationTools = require('users/svangordon/atelier:classificationTools')
// var classificationTools = require('users/svangordon/atelier:classificationTools')
var displayClassification = classificationTools.displayClassification
var classifyZone = classificationTools.classifyZone
var getZonesBoundaries = classificationTools.getZonesBoundaries

var zones = getZonesBoundaries(geometry)
Map.addLayer(zones)
// Map.addLayer(geometry, {}, 'geometry')
print(zones)

var classifiedZones = zones.map(classifyZone)
print(classifiedZones)
var classifiedImage = ee.ImageCollection(classifiedZones).median()
displayClassification(classifiedImage, 'classifiedZones')
