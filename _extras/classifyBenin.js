var zoneSize = 56000
var landsatBands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']


/*
  Paste in some function from earlier
*/
function getClassificationZone(pointGeometry, zoneSize) {
  pointGeometry = ee.FeatureCollection(pointGeometry).geometry().buffer(ee.Number(zoneSize).divide(2))
  var atlasProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image.random()
    .multiply(10000000)
    .toInt()
    .reduceToVectors({
      crs: atlasProjection,
      scale: zoneSize,
      geometry: pointGeometry,
      geometryInNativeProjection: true
    })
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

function getPoints(zoneGeometry) {
  var labelProjection = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km').projection()
  return ee.Image
    .random()
    .multiply(100000)
    .toInt()
    .reduceToVectors({
      crs: labelProjection,
      geometry: zoneGeometry,
      scale: labelProjection.nominalScale(),
      geometryInNativeProjection: true
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


// Load feature collection of country boundaries
var countryBoundaries = ee.FeatureCollection('USDOS/LSIB/2013')
// Select our contry of interest
var countryOfInterest = "BENIN"
var aoiBoundary = countryBoundaries.filter(ee.Filter.eq('name', countryOfInterest))

Map.addLayer(aoiBoundary)

var classificationZones = getClassificationZone(aoiBoundary, zoneSize)

Map.addLayer(classificationZones)

var classificationYears = [2001, 2004, 2007, 2010, 2013, 2016]

/*
  Create year-zone pairs
*/
function getAoiYearPairs(areasOfInterest, yearsOfInterest) {
  return ee.FeatureCollection(areasOfInterest)
    .map(function(aoi) {
      return aoi.set('years', yearsOfInterest)
      // var yearAoiPairs =  ee.List(classificationYears)
      //   .map(function(yearOfInterest) {
      //     return aoi
      //       .set('year', yearOfInterest)
      //   })
      // return ee.FeatureCollection(yearAoiPairs)
    })
    // .flatten()
}

var yearZonePairs = getAoiYearPairs(classificationZones, classificationYears)
print('yearZonePairs', yearZonePairs)

/*
  Create getImage function
*/


function getImage(imageAoi, year) {
  imageAoi = ee.Feature(imageAoi).geometry()
  var satelliteCollection = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')

  var baseStart = ee.Date.fromYMD(year, 9, 15)
  var baseEnd = ee.Date.fromYMD(year, 11, 15)
  // Create our temporal filters
  var lateYearFilter = ee.Filter.or(
    ee.Filter.date( baseStart.advance(-1, 'year'), baseEnd.advance(-1, 'year')),
    ee.Filter.date( baseStart,  baseEnd),
    ee.Filter.date( baseStart.advance(1, 'year'), baseEnd.advance(1, 'year'))
  )

  // Create our Landsat image for the later part of the year
  var lateLandsatImage = satelliteCollection
    .filterBounds(imageAoi)
    .filter(lateYearFilter)
    .map(maskLandsat)
    .median()

  // Create DEM data, and add calculated bands
  var demData = ee.Algorithms.Terrain(ee.Image("USGS/SRTMGL1_003"))

  return lateLandsatImage
    .addBands(demData)
    .clip(imageAoi)
}

Map.addLayer(getImage(classificationZones.first(), 2013), {bands: "B3, B2, B1", min:0, max:3000})

function classifyImage(yearZonePair) {
  yearZonePair = ee.Feature(yearZonePair)
  var classificationIndex = yearZonePair.get('system:index')
  var classificationYears = ee.List(yearZonePair.get('years'))
  var classificationAoi = yearZonePair.geometry()

  // Train classifier
  var trainingYear = 2013
  var labelImage = ee.Image('users/svangordon/conference/atlas/swa_2013lulc_2km')

  var trainingImage = getImage(classificationAoi, trainingYear).addBands(labelImage)
  var zonePoints = getPoints(classificationAoi)

  var zoneData = trainingImage
    .addBands(ee.Image.pixelLonLat())
    .sampleRegions({
      collection: zonePoints,
      scale: 30,
      projection: zonePoints.geometry().projection()
    })
    .map(toPoint)
    .randomColumn('trainTestSplit', 0)

  var trainingSize = 0.7
  var trainingData = zoneData.filter(ee.Filter.lt('trainTestSplit', trainingSize))
  var testingData = zoneData.filter(ee.Filter.gte('trainTestSplit', trainingSize))

  var classifier = ee.Classifier.randomForest(10).train(trainingData, 'b1', landsatBands)
  var testingAccuracy = testingData.classify(classifier).errorMatrix('b1', 'classification').accuracy()
  // return yearZonePair.set('testingAccuracy', testingAccuracy)

  var classifiedImages = classificationYears.map(function(classificationYear) {
    // Get collection of images that we are going to classify
    var classificationImage = getImage(classificationAoi, classificationYear)

    var classifiedImage = classificationImage.classify(classifier)
      .set('testingAccuracy', testingAccuracy)

    return classifiedImage
  })
  return classifiedImages
}
// // print(yearZonePairs.map(classifyImage))
// var clfdImages = classifyImage(yearZonePairs.first())
// print(clfdImages.size())

var classifiedImages = yearZonePairs.map(classifyImage).flatten()

var workshopTools = require('users/svangordon/lulc-conference:workshopTools')
var displayAtlasClassification = workshopTools.displayAtlasClassification
displayAtlasClassification(clfdImages.get(0), 'clfd first')

classifiedImages.size().evaluate(function(clfdImagesSize) {
  print('starting eval fn')
  var numberOfZones = yearZonePairs.size().getInfo()
  var numberOfYears = classificationYears.length
  for (var imageIndex = 0; imageIndex < clfdImagesSize; imageIndex++) {
    var zoneId = Math.floor(imageIndex / numberOfYears)
    var yearIndex = imageIndex % numberOfYears
    var year = classificationYears[yearIndex]
    print('zoneId', zoneId, 'year', year)

    var classificationAoi = ee.Feature(yearZonePairs.toList(1, zoneId).get(0)).geometry()
    var classifiedImage = ee.Image(clfdImages.get(imageIndex))

    // Export classified Image
    Export.image.toDrive({
      image: classifiedImage,
      folder: 'classifiedLulc',
      region: classificationAoi,
      fileNamePrefix: 'classification_zone_' + zoneId + '_' + year,
      scale: 30,
      description: 'classification_zone_' + zoneId + '_' + year,
      maxPixels: 1e13
    });
  }
  // var zoneId =
  // print('clfd images size', size, yearsSize)
})
