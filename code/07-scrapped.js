/*
  A version of episode 7's code, with a bunch of stuff that i have decided to scrap, like stratified sampling (crazy waste of time)
*/

var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification

var landsat7Collection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

var classificationPoint = /* color: #d63000 */ee.Geometry.Point([-12.392578125, 12.399002919688813]);
var zoneSize = 56000
// var labelProjection = atlasImage.projection()
// var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2000lulc_2km')
var atlasImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')
var classBand = 'b1'

function getClassificationZone(pointGeometry, zoneSize) {
  var atlasProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: atlasProjection,
      scale: zoneSize,
      geometry: pointGeometry
    })
}

function getPoints(zoneGeometry) {
  var labelProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      scale: labelProjection.nominalScale()
    })
    .map(function(feature) {
      var centroid = feature.centroid(5)
      return centroid
    })
}

function toPoint(feature) {
  feature = ee.Feature(feature)
  return ee.Feature(
    ee.Geometry.Point([feature.get('longitude'), feature.get('latitude')]),
    feature.toDictionary().remove(['longitude', 'latitude']))
}

var classificationZone = getClassificationZone(classificationPoint, zoneSize)

displayAtlasClassification(atlasImage.clip(classificationZone))

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

var zoneImage = landsat7Collection
  .filterBounds(classificationZone)
  .filter(getLateYearFilter(2013))
  .map(maskLandsat)
  .median()
  .addBands(atlasImage)
  .clip(classificationZone)

function getLandsatImage(geometry) {
  return landsat7Collection
    .filterBounds(geometry)
    .filter(getLateYearFilter(2013))
    .map(maskLandsat)
    .median()
    .addBands(atlasImage)
    .clip(geometry)
}

var labelProjection = atlasImage.projection()

// var zonePoints = ee.Image
//   .random()
//   .multiply(100000)
//   .toInt()
//   .reduceToVectors({
//     crs: labelProjection,
//     geometry: classificationZone,
//     scale: labelProjection.nominalScale()
//   })
//   .map(function(feature) {
//     var centroid = feature.centroid(5)
//     return centroid
//   })
var zonePoints = getPoints(classificationZone)


var landsatBands = ee.List(['B1', 'B2', 'B3', 'B4', 'B5', 'B7'])


function assessClassification(trainingImage, samplingPoints, trainingBands, title) {
  var imageData = trainingImage
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: samplingPoints,
      scale: 30
    })
    .map(toPoint)
    .randomColumn('random', 0)
  var trainingSize = 0.7
  var trainingData = imageData.filter(ee.Filter.lt('random', trainingSize))
  var testingData = imageData.filter(ee.Filter.gte('random', trainingSize))
  var classifier = ee.Classifier.randomForest(10).train(trainingData, 'b1', trainingBands)

  print(classifier)
  print(trainingData.classify(classifier))

  print(title,
    "testing accuracy:", testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy(),
    "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa()
  )
  // print(title, "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa())
  displayAtlasClassification(trainingImage.classify(classifier), title)
}

/*
  Including neighboring zones
*/

var neighborZonePoint = /* color: #d63000 */ee.Geometry.Point([-12.444763162638992, 12.427175804835738]);

var neighborZone = getClassificationZone(neighborZonePoint, zoneSize)

var neighborImage = landsat7Collection
  .filterBounds(neighborZone)
  .filter(getLateYearFilter(2013))
  .map(maskLandsat)
  .median()
  .addBands(atlasImage)
  .clip(neighborZone)

var neighborPoints = ee.Image
  .random()
  .multiply(100000)
  .toInt()
  .reduceToVectors({
    crs: labelProjection,
    geometry: neighborZone,
    scale: labelProjection.nominalScale()
  })
  .map(function(feature) {
    var centroid = feature.centroid(5)
    return centroid
  })

/*
  Get testing points
*/

// print('number of points', zonePoints.size().multiply(trainTestSplit).toInt())
var expandedZone = classificationZone.geometry().buffer(zoneSize)
// var expandedPoints = getPoints(expandedZone)
var expandedPoints = getPoints(expandedZone.difference(classificationZone, 10))
Map.addLayer(expandedPoints, {color: 'green'}, 'expanded points')

// var imageData = zoneImage
//   .addBands(ee.Image.pixelLonLat())
//   .sampleRegions({
//     collection: zonePoints,
//     scale: 30
//   })
//   .map(toPoint)
//   .randomColumn('random', 0)

// var testingPoints = zoneImage.addBands(ee.Image.pixelLonLat())
//   .sample({
//     region: zonePoints,
//     scale: 30,
//     projection: ee.Image(landsat7Collection.first()).projection(),
//     factor: 0.3,
//     seed: 0
//   })
//   .map(toPoint)
// var altTestingPoints = zoneImage.addBands(ee.Image.pixelLonLat())
//   .sample({
//     region: zonePoints,
//     scale: 30,
//     factor: 0.3,
//     seed: 0
//   })
//   .map(toPoint)

// var trainingPoints = zoneImage.addBands(ee.Image.pixelLonLat())
//   .sampleRegions()

Map.addLayer(testingPoints, {}, 'testingPoints')
Map.addLayer(altTestingPoints, {}, 'altTestingPoints')

function stratifiedSplit(collection, splitPercentage) {
  collection = ee.FeatureCollection(collection).randomColumn('classSplit')
  splitPercentage = ee.Number(splitPercentage)
  var classesPresent = ee.Dictionary(collection.aggregate_histogram(classBand))
  // print('classesPresent', classesPresent)
  // print('classBand', classBand)
  // print('collection', collection)
  // print('single filter', collection.filter(ee.Filter.eq(classBand, 2)))
  var splits = classesPresent.map(function(classValue, classCount) {
    var classCollection = collection.filter(ee.Filter.eq(classBand, ee.Number.parse(classValue)))
    var trainingSize = ee.Number(classCount).multiply(splitPercentage).toInt()
    var testingSize = ee.Number(classCount).subtract(ee.Number(trainingSize))

    var trainingSamples = classCollection.limit(trainingSize, 'classSplit', true)
    var testingSamples = classCollection.limit(testingSize, 'classSplit', false)

    return [trainingSamples, testingSamples]
  })
  var trainingSet = splits.map(function(_, split) {
    return ee.List(split).get(0)
  }).values()
  var testingSet = splits.map(function(_, split) {
    return ee.List(split).get(1)
  }).values()
  trainingSet = ee.FeatureCollection(trainingSet).flatten()
  testingSet = ee.FeatureCollection(testingSet).flatten()
  // print('testing', testingSet.aggregate_histogram(classBand), 'training', trainingSet.aggregate_histogram(classBand))
  return [trainingSet, testingSet]
}

assessClassification(zoneImage, zonePoints, landsatBands, 'baseline')


assessClassification(neighborImage, neighborPoints, landsatBands, 'neighbor classification')

var trainTestSplit = 0.7


var trainSize = zonePoints.size().multiply(trainTestSplit).toInt()
var zoneTrainingData = zoneImage
  .addBands(ee.Image.pixelLonLat())
  .sampleRegions({
    collection: zonePoints,
    scale: 30
  })
  // .stratifiedSample({
  //   numPoints: trainSize,
  //   scale: 30,
  //   classBand: 'b1',
  //   region: zonePoints,
  //   seed: 0
  // })
  .map(toPoint)
  .randomColumn('random', 0)


var expandedImage = getLandsatImage(expandedZone)

var expandedData = expandedImage
  .addBands(ee.Image.pixelLonLat())
  .sampleRegions({
    collection: expandedPoints,
    scale: 30
  })
  .map(toPoint)

print('class breakdown', zoneTrainingData.aggregate_histogram('b1'))

print('stratifiedSplit zone data', stratifiedSplit(zoneTrainingData, 0.7))

print('trainSize', trainSize, 'zoneTrainingData size', zoneTrainingData.size())
Map.addLayer(zoneTrainingData, {color: 'orange'}, 'zoneTrainingData')

Map.addLayer(expandedZone, {}, 'expanded zone')

Map.addLayer(neighborZone, {}, 'neighborZone')
Map.addLayer(zonePoints, {color: 'green'}, 'sampling points')


Map.addLayer(expandedData, {}, 'expandedData')

print('expandedData histo', ee.Dictionary(expandedData.aggregate_histogram('b1')).keys())

displayAtlasClassification(atlasImage.clip(expandedZone), 'expanded atlas')

/*
  Now we want to oversample the points in the expanded zone.
*/

var altTrainingData = ee.FeatureCollection(ee.List(stratifiedSplit(zoneTrainingData, 0.7)).get(0))
var altTestingData = ee.FeatureCollection(ee.List(stratifiedSplit(zoneTrainingData, 0.7)).get(1))
print('altTrainingData', altTrainingData)
print('altTestingData', altTestingData)

// Get a list of all the classes in our expaned area
var expandedClasses = ee.Dictionary(expandedData.aggregate_histogram('b1')).keys().map(ee.Number.parse)
// Get the size of our training data set size; we want the number of expanded datapoints to equal the
// number of in-zone datapoints
var sizeOfZoneTrainingSet = zoneTrainingData.size()
// The size of the zoneTrainingSet divided by the number of classes == points per class
var sizePerClass = sizeOfZoneTrainingSet.divide(expandedClasses.size()).toInt()
print('sizePerClass', sizePerClass)
print('expandedClasses', expandedClasses)

// We now repeat the expanded image as many times as we want features for each class
var oversampledData = ee.ImageCollection(ee.List.repeat(expandedImage.addBands(ee.Image.pixelLonLat()), sizePerClass))
  .map(function(image) {
    return image.stratifiedSample({
      numPoints: 1,
      classBand: 'b1',
      region: expandedPoints.geometry().difference(altTrainingData.geometry()),
      scale: 30
    })
    .map(toPoint)
  }).flatten()
print('oversampledData oversampled', oversampledData)
print('oversampledData oversampled histogram', oversampledData.aggregate_histogram('b1'))
oversampledData = expandedImage.sample({
  region: expandedPoints.geometry().difference(altTestingData.geometry()),
  numPixels: altTrainingData.size(),
  scale: 30
})

var trainingSize = 0.7
// var trainingData = imageData.filter(ee.Filter.lt('random', trainingSize))
// var testingData = imageData.filter(ee.Filter.gte('random', trainingSize))
var trainingData = altTrainingData.merge(oversampledData)
var testingData = altTestingData
var classifier = ee.Classifier.randomForest(10).train(trainingData, 'b1', landsatBands)
// 0.5654008438818565
print('oversampled',
  "testing accuracy:", testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy(),
  "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa()
)
// print(title, "kappa score:", testingData.classify(classifier).errorMatrix('b1', 'classification').kappa())
displayAtlasClassification(zoneImage.classify(classifier), 'oversampled ish')
