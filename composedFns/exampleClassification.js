var geometry = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[-0.538330078125, 14.519780046326085],
          [0.50537109375, 14.477234210156519],
          [0.50537109375, 14.987239525774244],
          [-0.472412109375, 15.061514891072227]]]);

var externalFunctions = require('users/svangordon/atelier:externalFunctions')
var displayClassification = externalFunctions.displayClassification
var internalFunctions = require('users/svangordon/atelier:internalFunctions')
var classifyZone = internalFunctions.classifyZone
var getZonesBoundaries = internalFunctions.getZonesBoundaries

var zones = getZonesBoundaries(geometry)
Map.addLayer(zones)
// Map.addLayer(geometry, {}, 'geometry')
print(zones)

var classifiedZones = zones.map(classifyZone)
print(classifiedZones)
var classifiedImage = ee.ImageCollection(classifiedZones).median()
displayClassification(classifiedImage, 'classifiedZones')
