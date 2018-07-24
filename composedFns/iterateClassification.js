var externalFunctions = require('users/svangordon/atelier:externalFunctions')
var displayClassification = externalFunctions.displayClassification
var internalFunctions = require('users/svangordon/atelier:internalFunctions')
var classifyZone = internalFunctions.classifyZone
var getZonesBoundaries = internalFunctions.getZonesBoundaries

function iterator(currentZone, accum) {

  var classifiedZone = ee.Image(classifyZone(currentZone))
  // var catdImage = ee.Image.cat(accum, classifiedZone)
  // return catdImage
  // return classifiedZone
  var output = ee.ImageCollection(accum).merge(ee.ImageCollection(classifiedZone))
  return output
}
var zones = getZonesBoundaries(geometry)
Map.addLayer(zones)
// Map.addLayer(geometry, {}, 'geometry')
print(zones)

var classifiedZones = zones.map(classifyZone)
print(classifiedZones)
var classifiedImage = ee.ImageCollection(classifiedZones).median()
displayClassification(classifiedImage, 'classifiedZones')

var accuracy = ee.ImageCollection(classifiedZones).aggregate_mean('accuracy')
print('accuracy', accuracy)

var iteratedZones = zones.iterate(iterator, ee.ImageCollection([]))
print(iteratedZones)
var iteratedImage = ee.ImageCollection(iteratedZones).median()
displayClassification(iteratedImage, 'iteratedImage')
