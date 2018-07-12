var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

var classificationArea = /* color: #d63000 */ee.Geometry.Point([-12.392578125, 12.399002919688813]);
var zoneSize = 56000
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
// var labelProjection = atlasImage.projection()

var classificationZone = ee.Image.random()
  .multiply(10000000)
  .toInt()
  .reduceToVectors({
    crs: atlasImage.projection(),
    scale: zoneSize,
    geometry: classificationArea
  });

function getLateYearFilter(year) {
  return ee.Filter.or(
    ee.Filter.date( year - 1 + '-09-15',  year - 1 + '-11-15'),
    ee.Filter.date( year     + '-09-15',  year     + '-11-15'),
    ee.Filter.date( year + 1 + '-09-15',  year + 1 + '-11-15')
  )
}

function maskLandsat(image) {
  // Bits 0, 3, 4 and 5 are fill, cloud shadow, snow, and cloud.
  var fillBit = ee.Number(2).pow(0).int()
  var cloudShadowBit = ee.Number(2).pow(3).int()
  var snowBit = ee.Number(2).pow(4).int()
  var cloudBit = ee.Number(2).pow(5).int()

  // Get the pixel QA band.
  var qa = image.select('pixel_qa')

  var radsatMask = image
    .select('radsat_qa')
    .eq(0)

  var mask = radsatMask
    .and(qa.bitwiseAnd(cloudShadowBit).eq(0))
    .and(qa.bitwiseAnd(fillBit).eq(0))
    .and(qa.bitwiseAnd(snowBit).eq(0))
    .and(qa.bitwiseAnd(cloudBit).eq(0))
    // .and(image.select('sr_atmos_opacity').lte(300))

  return image
    .updateMask(mask)
    .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])
}

var landsatImage = landsat7Collection
  .filterBounds(classificationZone)
  .filter(getLateYearFilter(2013))
  .map(maskLandsat)
  .median()

var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var labelProjection = atlasImage.projection()

var samplingPoints = ee.Image
  .random()
  .multiply(100000)
  .toInt()
  .reduceToVectors({
    crs: labelProjection,
    geometry: classificationZone,
    scale: labelProjection.nominalScale()
  })
  .map(function(feature) {
    var centroid = feature.centroid(5)
    return centroid
  })

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}
Map.addLayer(samplingPoints)
var landsatData = landsatImage
  .addBands(ee.Image.pixelLonLat())
  .addBands(atlasImage)
  .aside(function(image) {
    Map.addLayer(image, {min: 0, max: 3000, bands: "B3,B2,B1"})
  })
  .sampleRegions({
    collection: samplingPoints,
    scale: 30
  })
  .aside(function(collection) {
    print(collection)
  })
  .map(toPoint)
  .aside(function(collection) {
    print('landsatData with geometries', collection)
  })
// Code up to this point available at: https://code.earthengine.google.com/df26cb639aa4f06ee6e7c9bb543a4c92
  .randomColumn('random', 0)
  .aside(function(collection) {
    print('collection with random', collection.limit(5))
  })

// Convert longitude and latitude bands to a geometry.
var toPoints = function(fc) {
  return ee.FeatureCollection(fc).map(function(f) {
    f = ee.Feature(f)
    return ee.Feature(
      ee.Geometry.Point([f.get('longitude'), f.get('latitude')]),
      f.toDictionary().remove(['longitude', 'latitude']))
  })
}

var trainingSize = 0.7
var trainingData = landsatData.filter(ee.Filter.lt('random', trainingSize))
var testingData = landsatData.filter(ee.Filter.gte('random', trainingSize))

Map.addLayer(trainingData, {color: 'blue'}, 'Training Data')
Map.addLayer(testingData, {color: 'red'}, 'Testing Data')

var classifier = ee.Classifier.randomForest(20)

var trainingBands = ["B1", "B2", "B3", "B4", "B5", "B7"]
classifier = classifier.train(trainingData, 'b1', trainingBands)

print(classifier)

var trainingAccuracy = classifier.confusionMatrix().accuracy()
print('Training Accuracy:', trainingAccuracy)

var testingAccuracy = testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy()
print('Testing Accuracy:', testingAccuracy)

var testingClasses = ee.Dictionary(testingData.aggregate_histogram('b1'))
  .keys()
  .map(function(classValue) {
    return ee.Number.parse(classValue)
  })
  .sort()
print('testingClasses', testingClasses)

var errorMatrix = testingData.classify(classifier).errorMatrix('b1', 'classification', testingClasses)
var testingAccuracy = errorMatrix.accuracy()
print('Testing Accuracy:', testingAccuracy)
print(errorMatrix)


var producersAccuracy = errorMatrix.producersAccuracy()
print('producersAccuracy', producersAccuracy)

var consumersAccuracy = errorMatrix.consumersAccuracy()
print('consumersAccuracy', consumersAccuracy)

producersAccuracy = ee.Dictionary.fromLists(
  testingClasses.map(ee.Algorithms.String),
  errorMatrix.producersAccuracy().project([0]).toList()
)
print(producersAccuracy)

var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification

var classifiedImage = landsatImage.clip(classificationZone).classify(classifier)

displayAtlasClassification(classifiedImage, 'Classified Image')
